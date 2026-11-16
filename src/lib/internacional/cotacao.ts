// Cotação do dólar e do euro (PTAX de venda do Banco Central), para o valor aproximado ao lado do preço em reais.
// API pública do Banco Central, sem chave: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
// A cotação muda uma vez por dia útil; o cache relê a cada hora. Se a API falhar, a página sai só com o preço em reais.
import 'server-only'
import { cacheLife } from 'next/cache'
import type { Moeda } from './idiomas'

export interface Cotacao {
  /** Reais por unidade da moeda. */
  valor: number
  /** Data e hora da cotação (ISO). */
  data: string
}

const API = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata'

/** "MM-DD-AAAA", o formato que a API espera. */
function dataApi(d: Date) {
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${d.getUTCFullYear()}`
}

async function buscarCotacao(moeda: Moeda): Promise<Cotacao | undefined> {
  // Dez dias para trás: cobre fim de semana e feriados.
  const fim = new Date()
  const inicio = new Date(fim.getTime() - 10 * 24 * 60 * 60 * 1000)
  const url =
    `${API}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@moeda='${moeda}'&@dataInicial='${dataApi(inicio)}'&@dataFinalCotacao='${dataApi(fim)}'` +
    `&$format=json&$select=cotacaoVenda,dataHoraCotacao,tipoBoletim`
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
    const { value } = (await resposta.json()) as { value: { cotacaoVenda: number; dataHoraCotacao: string; tipoBoletim: string }[] }
    // O boletim de fechamento é a PTAX do dia; no meio do dia só há os intermediários.
    const fechamentos = value.filter((c) => c.tipoBoletim === 'Fechamento')
    const ultima = (fechamentos.length ? fechamentos : value).at(-1)
    if (!ultima || !(ultima.cotacaoVenda > 0)) return undefined
    // "2026-11-13 13:09:27.123" (horário de Brasília) → ISO.
    const data = new Date(`${ultima.dataHoraCotacao.replace(' ', 'T').slice(0, 19)}-03:00`).toISOString()
    return { valor: ultima.cotacaoVenda, data }
  } catch (erro) {
    console.error(`[cotacao] ${moeda}:`, erro)
    return undefined
  }
}

export async function obterCotacoes(): Promise<Partial<Record<Moeda, Cotacao>>> {
  'use cache'
  cacheLife('hours')
  const [USD, EUR] = await Promise.all([buscarCotacao('USD'), buscarCotacao('EUR')])
  return { ...(USD && { USD }), ...(EUR && { EUR }) }
}
