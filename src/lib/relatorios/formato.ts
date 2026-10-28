// Números e textos dos relatórios (pt-BR). Sem dependência de servidor: o navegador também usa.

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export const fmtInt = (n: number) => inteiro.format(n)
export const fmtDec = (n: number) => decimal1.format(n)
/** 1.234 → "1,2 mil" (eixos e rótulos curtos). */
export const fmtCompacto = (n: number) => (Math.abs(n) < 1000 ? inteiro.format(n) : compacto.format(n))
export const fmtMoeda = (n: number) => moeda.format(n)
export const fmtMoedaCompacta = (n: number) => (n >= 1_000_000 ? `R$ ${decimal1.format(n / 1_000_000)} mi` : n >= 1000 ? `R$ ${inteiro.format(Math.round(n / 1000))} mil` : moeda.format(n))

/** 0.1234 → "12,3%". */
export const fmtPct = (fracao: number, casas = 1) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas }).format(fracao * 100)}%`

/** Divisão que não quebra com zero. */
export const razao = (a: number, b: number) => (b > 0 ? a / b : 0)

/** 125 → "2min 05s". */
export function fmtDuracao(segundos: number) {
  const s = Math.round(segundos)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}min ${String(s % 60).padStart(2, '0')}s` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min`
}

export interface Variacao {
  /** (atual - anterior) / anterior; `null` se não há base de comparação. */
  fracao: number | null
  atual: number
  anterior: number
}

export const variacao = (atual: number, anterior: number): Variacao => ({ atual, anterior, fracao: anterior > 0 ? (atual - anterior) / anterior : null })
