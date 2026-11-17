// Números, faixas, datas e preços dos imóveis no idioma da página (a versão em português fica em lib/imoveis/formato.ts).
import type { Faixa } from '@/lib/imoveis/tipos'
import type { Dicionario } from './dicionario'
import type { Cotacao } from './cotacao'
import { DADOS_IDIOMA, MOEDAS, type DadosMoeda, type Idioma } from './idiomas'

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
  // Idiomas sem abreviação usam a palavra inteira, então precisam do singular ("1 bagno", não "1 bagni").
  const curto = d.formato.banheirosCurto === d.formato.banheiros && b.max === 1 ? d.formato.banheiro : d.formato.banheirosCurto
  return `${faixa(b, d)} ${curto}`
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
  return new Intl.NumberFormat(DADOS_IDIOMA[idioma].locale, {
    style: 'currency',
    currency: 'BRL',
    // "R$" em todos os idiomas (o padrão do italiano e do espanhol escreve "BRL").
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(valor)
}

/**
 * Arredonda o preço convertido ao milhar, como sempre foi em dólar e em euro; nas moedas em que o valor tem muitos dígitos
 * (iene, won, rupia…), a quatro algarismos ("￥70,120,000", não "￥70,123,000").
 */
function arredondar(valor: number) {
  const unidade = Math.max(1000, 10 ** (Math.floor(Math.log10(valor)) - 3))
  return Math.round(valor / unidade) * unidade
}

/** Formata um valor na moeda do idioma, sem centavos. */
function formatoMoeda(idioma: Idioma) {
  const { locale, moeda } = DADOS_IDIOMA[idioma]
  const formato = new Intl.NumberFormat(locale, { style: 'currency', currency: moeda, maximumFractionDigits: 0 })
  const { simbolo }: DadosMoeda = MOEDAS[moeda]
  if (!simbolo) return (valor: number) => formato.format(valor)
  return (valor: number) => formato.formatToParts(valor).map((p) => (p.type === 'currency' ? simbolo : p.value)).join('')
}

/**
 * Preço no idioma: o valor convertido para a moeda do idioma (a do país dele, pela cotação de fechamento do Banco
 * Central) e arredondado. As páginas internacionais mostram só esse valor. Sem cotação (arquivo do Banco Central fora do
 * ar), sai o preço em reais, o único disponível; sem preço, "Price on request".
 */
export function precoNoIdioma(valor: number, idioma: Idioma, cotacao: Cotacao | undefined, d: Dicionario) {
  const convertido = valor > 0 && cotacao ? arredondar(valor / cotacao.valor) : 0
  if (!(convertido > 0)) return formatarReais(valor, idioma, d)
  return formatoMoeda(idioma)(convertido)
}

/** Limites do filtro de preço máximo, pensados em dólar; nas outras moedas, multiplicados pela escala delas (MOEDAS). */
const LIMITES_PRECO = [100_000, 200_000, 300_000, 500_000, 1_000_000]

/** Opções do filtro de preço máximo ("Up to $200,000"), ou nenhuma sem cotação (aí não dá para converter). */
export function opcoesPrecoMaximo(idioma: Idioma, cotacao: Cotacao | undefined, d: Dicionario) {
  if (!cotacao) return []
  const { escala } = MOEDAS[DADOS_IDIOMA[idioma].moeda]
  const formatar = formatoMoeda(idioma)
  return LIMITES_PRECO.map((limite) => {
    const valor = limite * escala
    return { valor: String(valor), rotulo: d.imoveis.ateValor.replace('{valor}', formatar(valor)) }
  })
}
