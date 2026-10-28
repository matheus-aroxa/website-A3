// Confere o que o navegador mandou. O endpoint é público: nada do corpo é confiável, então tudo é recortado e validado.
import { TIPOS_EVENTO, type Carga, type Detalhe, type TipoEvento } from './tipos'

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined)
const numero = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : undefined)

function lerDetalhe(v: unknown): Detalhe | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const saida: Detalhe = {}
  for (const [chave, valor] of Object.entries(v).slice(0, 8)) {
    if (!/^[a-z][a-z0-9_]{0,15}$/.test(chave)) continue
    if (typeof valor === 'string') saida[chave] = valor.slice(0, 160)
    else if (typeof valor === 'number' && Number.isFinite(valor)) saida[chave] = valor
    else if (Array.isArray(valor)) saida[chave] = valor.filter((x): x is string => typeof x === 'string').slice(0, 24).map((x) => x.slice(0, 80))
  }
  return Object.keys(saida).length ? saida : undefined
}

const PV = /^[A-Za-z0-9_-]{8,24}$/

/** Só caminhos do próprio site, em minúsculas e sem barra no fim. */
export function limparCaminho(v: unknown) {
  const c = texto(v, 300)
  if (!c || !c.startsWith('/') || c.startsWith('//')) return undefined
  const semQuery = c.split(/[?#]/)[0]!.toLowerCase()
  return semQuery.length > 1 ? semQuery.replace(/\/+$/, '') : semQuery
}

export function lerCarga(bruto: unknown): Carga | null {
  if (!bruto || typeof bruto !== 'object') return null
  const b = bruto as Record<string, unknown>

  if (b.t === 'saida') {
    const pv = texto(b.pv, 24)
    if (!pv || !PV.test(pv)) return null
    const w: Record<string, number> = {}
    const medidas = b.w && typeof b.w === 'object' ? (b.w as Record<string, unknown>) : {}
    for (const chave of ['lcp', 'cls', 'inp', 'fcp', 'ttfb'] as const) {
      const n = medidas[chave]
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) w[chave] = chave === 'cls' ? Math.min(10, Math.round(n * 1000) / 1000) : Math.min(600_000, Math.round(n))
    }
    return { t: 'saida', pv, s: numero(b.s, 0, 4 * 3600) ?? 0, p: numero(b.p, 0, 100) ?? 0, ...(Object.keys(w).length && { w }) }
  }

  if (typeof b.t !== 'string' || !(TIPOS_EVENTO as readonly string[]).includes(b.t)) return null
  const c = limparCaminho(b.c)
  if (!c) return null
  const pv = texto(b.pv, 24)
  if (b.t === 'visita' && !(pv && PV.test(pv))) return null
  return {
    t: b.t as TipoEvento,
    c,
    r: texto(b.r, 150),
    v: numero(b.v, -1_000_000, 1_000_000_000),
    i: texto(b.i, 200),
    d: lerDetalhe(b.d),
    ...(b.t === 'visita' && { pv }),
    ref: texto(b.ref, 400),
    q: texto(b.q, 600),
    w: numero(b.w, 0, 10_000),
    l: texto(b.l, 12),
  }
}
