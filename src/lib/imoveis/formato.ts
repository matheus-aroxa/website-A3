import type { Faixa, Finalidade, ImovelResumo, Situacao, TipoImovel } from './tipos'

export const SITUACOES: Situacao[] = ['breve-lancamento', 'lancamento', 'em-construcao', 'pronto']
export const TIPOS: TipoImovel[] = ['apartamento', 'casa-condominio', 'terreno']

export const rotuloSituacao: Record<Situacao, string> = {
  'breve-lancamento': 'Breve lançamento',
  lancamento: 'Lançamento',
  'em-construcao': 'Em construção',
  pronto: 'Pronto para morar',
}

export const rotuloTipo: Record<TipoImovel, string> = {
  apartamento: 'Apartamento',
  'casa-condominio': 'Casa de condomínio',
  terreno: 'Terreno',
}

export const rotuloTipoPlural: Record<TipoImovel, string> = {
  apartamento: 'Apartamentos',
  'casa-condominio': 'Casas de condomínio',
  terreno: 'Terrenos',
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const decimal = (casas: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })

export function formatarPreco(valor: number, finalidade: Finalidade) {
  // Intl usa espaço não separável entre "R$" e o número; mantém a quebra de linha correta.
  const texto = reais.format(valor)
  return finalidade === 'aluguel' ? `${texto}/mês` : texto
}

export function rotuloPreco(finalidade: Finalidade) {
  return finalidade === 'aluguel' ? 'Aluguel' : 'Investimento a partir de'
}

/** Cards: inteiro nas faixas ("50 a 91 m²"), uma casa decimal em valor único ("51,7 m²"). */
export function formatarAreaCurta({ min, max }: Faixa) {
  if (min === max) return `${decimal(1).format(min)} m²`
  return `${Math.floor(min)} a ${Math.floor(max)} m²`
}

export function formatarArea({ min, max }: Faixa) {
  if (min === max) return `${decimal(2).format(min)} m²`
  return `${decimal(2).format(min)} a ${decimal(2).format(max)} m²`
}

function faixaTexto({ min, max }: Faixa) {
  if (min === max) return String(min)
  return max - min === 1 ? `${min} ou ${max}` : `${min} a ${max}`
}

export function formatarQuartos(q: Faixa) {
  return `${faixaTexto(q)} ${q.max === 1 ? 'quarto' : 'quartos'}`
}

export function formatarBanheiros(b: Faixa) {
  return b.min === b.max ? `${b.min} banh.` : `${b.min} a ${b.max} banh.`
}

export function formatarVagas(v: Faixa | null) {
  if (!v) return 'Vaga a consultar'
  return `${faixaTexto(v)} ${v.max === 1 ? 'vaga' : 'vagas'}`
}

export function formatarFaixa(f: Faixa) {
  return faixaTexto(f)
}

/** "2028-01" → "jan/2028" */
export function formatarEntregaCurta(entrega: string) {
  const [ano, mes] = entrega.split('-')
  return `${MESES[Number(mes) - 1]}/${ano}`
}

/** "2028-01" → "Janeiro de 2028" */
export function formatarEntrega(entrega: string) {
  const [ano, mes] = entrega.split('-')
  return `${MESES_EXTENSO[Number(mes) - 1]} de ${ano}`
}

/** Rótulo da etiqueta sobre a foto do card. */
export function etiquetaImovel(imovel: Pick<ImovelResumo, 'finalidade' | 'situacao'>) {
  return imovel.finalidade === 'aluguel' ? 'Para alugar' : rotuloSituacao[imovel.situacao]
}

/** Texto do canto inferior direito do card: previsão de entrega ou código. */
export function rodapeCard(imovel: Pick<ImovelResumo, 'entrega' | 'situacao' | 'codigo'>) {
  if (imovel.entrega && imovel.situacao !== 'pronto') return `Entrega ${formatarEntregaCurta(imovel.entrega)}`
  return `Cód. ${imovel.codigo}`
}

export function pluralImoveis(n: number) {
  return `${n} ${n === 1 ? 'imóvel' : 'imóveis'}`
}

export function slugificar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function normalizarBusca(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Número digitado no formato brasileiro: "265.000", "50,84", "1.234,5" (e também "50.84").
 * `undefined` para vazio, `NaN` para texto que não é número.
 */
export function lerNumeroBr(texto: string) {
  let bruto = texto.replace(/\s/g, '')
  if (!bruto) return undefined
  if (bruto.includes(',')) bruto = bruto.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) bruto = bruto.replace(/\./g, '')
  return /^\d+(\.\d+)?$/.test(bruto) ? Number(bruto) : NaN
}
