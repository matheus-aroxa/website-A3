// Cotação das moedas dos idiomas (taxa de venda do fechamento do Banco Central), para o preço na moeda do idioma.
// Arquivo público do Banco Central, sem chave, um por dia útil: https://www4.bcb.gov.br/Download/fechamento/AAAAMMDD.csv.
// Traz cerca de 150 moedas: para o dólar, o euro, o iene, a coroa sueca… é a própria PTAX; para as que não têm PTAX
// (zloty, won, baht…), a taxa que o Banco Central calcula pela paridade com o dólar. Sai depois do fechamento da PTAX (por
// volta das 13h); antes disso, e em fim de semana e feriado, vale o último dia útil. O cache relê a cada hora. Se o arquivo
// não vier, a página sai com o preço em reais.
import 'server-only'
import { cacheLife } from 'next/cache'
import { MOEDAS, type Moeda } from './idiomas'

export interface Cotacao {
  /** Reais por unidade da moeda. */
  valor: number
  /** Dia da cotação (AAAA-MM-DD). */
  data: string
}

const ARQUIVO = 'https://www4.bcb.gov.br/Download/fechamento'

/** Quantos dias para trás procurar o último arquivo publicado (fim de semana, Carnaval, feriado emendado). */
const DIAS_PARA_TRAS = 8

/** "AAAAMMDD" do dia no horário de Brasília, `atras` dias antes de hoje. */
function diaEmBrasilia(atras: number) {
  const brasilia = new Date(Date.now() - 3 * 60 * 60 * 1000 - atras * 24 * 60 * 60 * 1000)
  return brasilia.toISOString().slice(0, 10).replaceAll('-', '')
}

/**
 * Linhas "13/11/2026;220;A;USD;5,65120000;5,65180000;1,00000000;1,00000000": data, código, tipo, moeda, taxa de compra
 * e de venda (reais por unidade), paridade de compra e de venda (com o dólar).
 */
function lerArquivo(csv: string) {
  const cotacoes: Partial<Record<Moeda, Cotacao>> = {}
  for (const linha of csv.split(/\r?\n/)) {
    const [data, , , moeda, , venda] = linha.split(';')
    if (!data || !moeda || !venda || !(moeda in MOEDAS)) continue
    const valor = Number(venda.replace(',', '.'))
    const [dia, mes, ano] = data.split('/')
    if (valor > 0) cotacoes[moeda as Moeda] = { valor, data: `${ano}-${mes}-${dia}` }
  }
  return cotacoes
}

export async function obterCotacoes(): Promise<Partial<Record<Moeda, Cotacao>>> {
  'use cache'
  cacheLife('hours')
  for (let atras = 0; atras <= DIAS_PARA_TRAS; atras++) {
    const dia = diaEmBrasilia(atras)
    try {
      const resposta = await fetch(`${ARQUIVO}/${dia}.csv`, { signal: AbortSignal.timeout(8000) })
      // Dia sem arquivo (ainda não publicado, fim de semana, feriado): tenta o anterior.
      if (resposta.status === 404) continue
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      const cotacoes = lerArquivo(await resposta.text())
      if (cotacoes.USD) return cotacoes
    } catch (erro) {
      // Fora do ar ou lento: os dias anteriores falhariam do mesmo jeito.
      console.error(`[cotacao] ${dia}:`, erro)
      return {}
    }
  }
  console.error(`[cotacao] nenhum arquivo de fechamento nos últimos ${DIAS_PARA_TRAS} dias`)
  return {}
}
