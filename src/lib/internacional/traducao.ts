// Tradução automática dos textos livres dos imóveis (descrição, lazer e proximidades fora do dicionário, plantas,
// legendas), que vêm só em português do banco ou da Viniun. Serviço: Amazon Translate (docs/area-internacional.md).
//
// Sob demanda: nada é traduzido de antemão. O texto só vai para a AWS quando alguém abre a ficha num idioma e a página
// ainda não está pronta no cache. Não há tabela no banco: cada tradução fica no cache do Next ("use cache: remote"),
// com o próprio texto em português como chave. Se a Viniun (ou o painel) muda a descrição, o texto muda, a chave muda e a
// tradução é refeita na hora; o que não mudou não é cobrado de novo quando a página é regenerada.
//
// Liga com TRADUTOR=aws. Credenciais: as mesmas da AWS do site (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY ou AWS_PROFILE),
// com a permissão translate:TranslateText. Região: TRADUTOR_REGIAO (padrão us-east-1).
// Sem serviço configurado, sem permissão ou com a AWS fora do ar, o texto fica no original em português (a página avisa e
// o navegador ainda pode traduzir, ver DescricaoNavegador) e é traduzido numa próxima geração da página.
import 'server-only'
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'
import { cacheLife } from 'next/cache'
import { DADOS_IDIOMA, tradutorAtivo, type Idioma } from './idiomas'

/** O Amazon Translate aceita até 10.000 bytes por chamada; parágrafo maior que isso (raro) fica no original. */
const LIMITE_BYTES = 10_000
/** Chamadas simultâneas por página: a ficha tem poucas dezenas de textos, e a AWS limita as chamadas por segundo. */
const SIMULTANEAS = 5

const ativo = tradutorAtivo

let cliente: TranslateClient | undefined
const translate = () => (cliente ??= new TranslateClient({ region: process.env.TRADUTOR_REGIAO?.trim() || 'us-east-1' }))

// ——— Limite mensal de caracteres ———
// Cada chamada real à AWS (não as que vêm do cache) gasta caracteres. Quando o mês passa do teto, as chamadas
// seguintes falham de propósito: o texto fica no original e nada é cobrado. O mês é contado no fuso de Recife.
// Limite: variável TRADUTOR_LIMITE_CARACTERES_MES (padrão 100.000 caracteres ≈ US$ 1,50 por mês, com US$ 2 de teto).
// Atenção: o contador fica na memória de cada instância da Vercel. Com várias instâncias ao mesmo tempo, o total
// do mês pode passar do teto. O teto que vale de verdade é o da AWS (Budget Action), ver o plano de custo.
const LIMITE_CARACTERES_MES = Number(process.env.TRADUTOR_LIMITE_CARACTERES_MES) || 100_000
let mesDoContador = ''
let caracteresNoMes = 0

/** Reserva caracteres para uma chamada à AWS. Devolve false quando o limite do mês já foi atingido. */
function reservarCaracteres(quantidade: number): boolean {
  const mes = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Recife' }).slice(0, 7)
  if (mes !== mesDoContador) {
    mesDoContador = mes
    caracteresNoMes = 0
  }
  if (caracteresNoMes + quantidade > LIMITE_CARACTERES_MES) return false
  caracteresNoMes += quantidade
  return true
}

const LIMITE_ATINGIDO = 'limite mensal de caracteres da tradução atingido'

/**
 * Tradução de um texto, guardada no cache compartilhado do Next pela combinação texto + idioma (os argumentos são a chave).
 * Erro não entra no cache: a próxima geração da página tenta de novo.
 */
async function traduzirNaAws(texto: string, idioma: Idioma, origem: 'pt' | 'en' = 'pt'): Promise<string> {
  'use cache: remote'
  cacheLife('max')
  if (!reservarCaracteres(texto.length)) throw new Error(LIMITE_ATINGIDO)
  const resposta = await translate().send(
    new TranslateTextCommand({ Text: texto, SourceLanguageCode: origem, TargetLanguageCode: DADOS_IDIOMA[idioma].aws }),
  )
  if (!resposta.TranslatedText) throw new Error('Amazon Translate: resposta sem texto')
  return resposta.TranslatedText
}

let avisado = false
function avisar(erro: unknown) {
  // Um aviso por processo basta (sem permissão, por exemplo, todas as chamadas falham igual).
  if (avisado) return
  avisado = true
  console.error('[traducao] Amazon Translate falhou; os textos ficam em português nesta geração da página:', erro)
}

export interface Traducoes {
  /** Texto traduzido de cada original; o próprio original quando não deu para traduzir. */
  traduzir(original: string): string
  /** Se o texto foi traduzido de fato (para avisar quando a página mostra o original). */
  traduzido(original: string): boolean
}

/** Traduz os textos para o idioma. Nunca lança erro: no pior caso, devolve os originais. */
export async function traduzirTextos(textos: string[], idioma: Idioma): Promise<Traducoes> {
  const prontas = new Map<string, string>()
  const resultado: Traducoes = {
    traduzir: (original) => prontas.get(original.trim()) ?? original,
    traduzido: (original) => prontas.has(original.trim()),
  }
  if (!ativo()) return resultado

  const unicos = [...new Set(textos.map((t) => t.trim()).filter((t) => t && Buffer.byteLength(t) <= LIMITE_BYTES))]
  // Poucas chamadas por vez (TranslateText traduz um texto por chamada).
  for (let i = 0; i < unicos.length; i += SIMULTANEAS) {
    const lote = unicos.slice(i, i + SIMULTANEAS)
    const respostas = await Promise.allSettled(lote.map((t) => traduzirNaAws(t, idioma)))
    respostas.forEach((r, j) => {
      if (r.status === 'fulfilled') prontas.set(lote[j]!, r.value)
      else avisar(r.reason)
    })
  }
  return resultado
}

// ——— Textos da página nos idiomas automáticos (automatico.ts) ———
// Cada texto é traduzido sozinho e guardado no cache com a própria chave (texto + idioma). Antes, os textos iam em
// blocos, e a chave era o bloco inteiro: mudar um texto refazia o bloco todo e a lista de blocos inteira se deslocava.
// Agora, mudar um texto custa só a tradução desse texto. As chamadas são feitas poucas de cada vez, por causa do
// limite de chamadas por segundo da AWS.

/**
 * Traduz do inglês textos de uma linha (quebras viram espaço). Devolve, na mesma ordem, a tradução de cada um ou
 * `null` quando não deu (a página usa o inglês). Nunca lança erro.
 */
export async function traduzirDoIngles(textos: string[], idioma: Idioma): Promise<(string | null)[]> {
  if (!ativo()) return textos.map(() => null)
  const limpos = textos.map((t) => t.replace(/\s*\n\s*/g, ' ').trim())
  const unicos = [...new Set(limpos.filter((t) => t && Buffer.byteLength(t) <= LIMITE_BYTES))]
  const prontas = new Map<string, string>()
  for (let i = 0; i < unicos.length; i += SIMULTANEAS) {
    const lote = unicos.slice(i, i + SIMULTANEAS)
    const respostas = await Promise.allSettled(lote.map((t) => traduzirNaAws(t, idioma, 'en')))
    respostas.forEach((r, j) => {
      if (r.status === 'fulfilled') prontas.set(lote[j]!, r.value.replace(/\s*\n\s*/g, ' ').trim())
      else avisar(r.reason)
    })
  }
  return limpos.map((t) => (t ? (prontas.get(t) ?? null) : t))
}
