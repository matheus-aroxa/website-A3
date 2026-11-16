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
import type { Idioma } from './idiomas'

/** O Amazon Translate aceita até 10.000 bytes por chamada; parágrafo maior que isso (raro) fica no original. */
const LIMITE_BYTES = 10_000
/** Chamadas simultâneas por página: a ficha tem poucas dezenas de textos, e a AWS limita as chamadas por segundo. */
const SIMULTANEAS = 5

const ativo = () => (process.env.TRADUTOR ?? '').trim().toLowerCase() === 'aws'

let cliente: TranslateClient | undefined
const translate = () => (cliente ??= new TranslateClient({ region: process.env.TRADUTOR_REGIAO?.trim() || 'us-east-1' }))

/**
 * Tradução de um texto, guardada no cache compartilhado do Next pela combinação texto + idioma (os argumentos são a chave).
 * Erro não entra no cache: a próxima geração da página tenta de novo.
 */
async function traduzirNaAws(texto: string, idioma: Idioma): Promise<string> {
  'use cache: remote'
  cacheLife('max')
  const resposta = await translate().send(
    new TranslateTextCommand({ Text: texto, SourceLanguageCode: 'pt', TargetLanguageCode: idioma }),
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
