// Números, faixas, datas e preços dos imóveis no idioma da página (a versão em português fica em lib/imoveis/formato.ts).
import type { Faixa } from '@/lib/imoveis/tipos'
import type { Dicionario } from './dicionario'
import type { Cotacao } from './cotacao'
import { DADOS_IDIOMA, type Idioma } from './idiomas'

function faixa({ min, max }: Faixa, d: Dicionario) {
  if (min === max) return String(min)
  return max - min === 1 ? `${min} ${d.formato.ou} ${max}` : `${min} ${d.formato.ate} ${max}`
}

/** "2 bedrooms", "2 or 3 bedrooms". */
export function formatarQuartos(q: Faixa, d: Dicionario) {
  return `${faixa(q, d)} ${q.max === 1 ? d.formato.quarto : d.formato.quartos}`
}

export function formatarBanheiros(b: Faixa, d: Dicionario) {
  return `${faixa(b, d)} ${b.max === 1 ? d.formato.banheiro : d.formato.banheiros}`
}

/** Cards: "2 bath.", como o "2 banh." do site em português. */
export function formatarBanheirosCurto(b: Faixa, d: Dicionario) {
  return `${faixa(b, d)} ${d.formato.banheirosCurto}`
}

export function formatarVagas(v: Faixa | null, d: Dicionario) {
  if (!v) return d.imovel.vagaConsultar
  if (v.max === 0) return d.formato.semVaga
  return `${faixa(v, d)} ${v.max === 1 ? d.formato.vaga : d.formato.vagas}`
}

export const formatarFaixa = faixa

export function formatarArea({ min, max }: Faixa, idioma: Idioma, d: Dicionario) {
  const n = new Intl.NumberFormat(DADOS_IDIOMA[idioma].locale, { maximumFractionDigits: 1 })
  return min === max ? `${n.format(min)} m²` : `${n.format(min)} ${d.formato.ate} ${n.format(max)} m²`
}

/** "Jan/2028", como o "jan/2028" do site em português. */
export function formatarEntregaCurta(entrega: string, d: Dicionario) {
  const [ano, mes] = entrega.split('-')
  return `${d.formato.mesesCurtos[Number(mes) - 1]}/${ano}`
}

/** "January 2028". */
export function formatarEntrega(entrega: string, d: Dicionario) {
  const [ano, mes] = entrega.split('-')
  return `${d.formato.meses[Number(mes) - 1]} ${ano}`
}

/** Preço oficial, em reais, no formato do idioma ("R$450,000" em inglês, "450.000 R$" em alemão). */
export function formatarReais(valor: number, idioma: Idioma, d: Dicionario) {
  if (!(valor > 0)) return d.imovel.sobConsulta
  return new Intl.NumberFormat(DADOS_IDIOMA[idioma].locale, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
}

/** Valor aproximado na moeda do idioma, arredondado ao milhar: "≈ $85,000", "≈ 78.000 €". */
export function formatarAproximado(valor: number, idioma: Idioma, cotacao: Cotacao | undefined, d: Dicionario) {
  if (!(valor > 0) || !cotacao) return null
  const convertido = Math.round(valor / cotacao.valor / 1000) * 1000
  if (convertido <= 0) return null
  const { locale, moeda } = DADOS_IDIOMA[idioma]
  const texto = new Intl.NumberFormat(locale, { style: 'currency', currency: moeda, maximumFractionDigits: 0 }).format(convertido)
  return d.imovel.aproximado.replace('{valor}', texto)
}

/** Data da cotação ("November 13, 2026"). */
export function formatarDataCotacao(cotacao: Cotacao, idioma: Idioma) {
  return new Intl.DateTimeFormat(DADOS_IDIOMA[idioma].locale, { dateStyle: 'long', timeZone: 'America/Recife' }).format(new Date(cotacao.data))
}
