// Período dos relatórios: presets (últimos 7/30/90 dias...) ou datas escolhidas, sempre em dias de Recife (AAAA-MM-DD).
// Usado no servidor (consultas) e no navegador (seletor), por isso não importa nada de servidor.

export const PRESETS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: 'Últimos 7 dias' },
  { valor: '30d', rotulo: 'Últimos 30 dias' },
  { valor: '90d', rotulo: 'Últimos 90 dias' },
  { valor: 'mes', rotulo: 'Este mês' },
  { valor: '12m', rotulo: 'Últimos 12 meses' },
  { valor: 'tudo', rotulo: 'Desde o início' },
] as const

export type Preset = (typeof PRESETS)[number]['valor']

export interface Periodo {
  de: string
  ate: string
  dias: number
  /** Preset escolhido, ou `null` quando as datas foram digitadas. */
  preset: Preset | null
  rotulo: string
}

export const PRESET_PADRAO: Preset = '30d'

const DIA_MS = 86_400_000
const ISO = /^\d{4}-\d{2}-\d{2}$/

const paraData = (iso: string) => new Date(`${iso}T00:00:00Z`)
const paraIso = (d: Date) => d.toISOString().slice(0, 10)

export const somarDias = (iso: string, n: number) => paraIso(new Date(paraData(iso).getTime() + n * DIA_MS))
export const diferencaEmDias = (de: string, ate: string) => Math.round((paraData(ate).getTime() - paraData(de).getTime()) / DIA_MS)

const dataValida = (v: string | undefined): v is string => !!v && ISO.test(v) && !Number.isNaN(paraData(v).getTime()) && paraIso(paraData(v)) === v

export const formatarDia = (iso: string, curto = false) => {
  const [a, m, d] = iso.split('-')
  return curto ? `${d}/${m}` : `${d}/${m}/${a}`
}

export interface ParametrosPeriodo {
  p?: string
  de?: string
  ate?: string
}

/**
 * Lê o período da URL (`?p=30d` ou `?de=2026-10-01&ate=2026-10-27`). `hoje` é o dia de hoje em Recife e `primeiroDia`, o primeiro
 * dia com dados (para "Desde o início"). Datas fora de ordem ou no futuro são corrigidas.
 */
export function lerPeriodo(params: ParametrosPeriodo, hoje: string, primeiroDia: string | null): Periodo {
  if (dataValida(params.de) && dataValida(params.ate)) {
    let [de, ate] = params.de <= params.ate ? [params.de, params.ate] : [params.ate, params.de]
    if (ate > hoje) ate = hoje
    if (de > ate) de = ate
    if (diferencaEmDias(de, ate) > 366 * 5) de = somarDias(ate, -366 * 5)
    return { de, ate, dias: diferencaEmDias(de, ate) + 1, preset: null, rotulo: de === ate ? formatarDia(de) : `${formatarDia(de)} a ${formatarDia(ate)}` }
  }
  const preset = PRESETS.find((x) => x.valor === params.p)?.valor ?? PRESET_PADRAO
  const de = {
    hoje: hoje,
    '7d': somarDias(hoje, -6),
    '30d': somarDias(hoje, -29),
    '90d': somarDias(hoje, -89),
    mes: `${hoje.slice(0, 8)}01`,
    '12m': somarDias(hoje, -364),
    tudo: primeiroDia && primeiroDia < hoje ? primeiroDia : hoje,
  }[preset]
  return { de, ate: hoje, dias: diferencaEmDias(de, hoje) + 1, preset, rotulo: PRESETS.find((x) => x.valor === preset)!.rotulo }
}

/** Todos os dias do período, em ordem. */
export function listarDias(p: Pick<Periodo, 'de' | 'ate'>) {
  const dias: string[] = []
  for (let d = p.de; d <= p.ate; d = somarDias(d, 1)) dias.push(d)
  return dias
}

/** Dia da semana (0 = domingo) de um dia AAAA-MM-DD. */
export const diaDaSemana = (iso: string) => paraData(iso).getUTCDay()

/** Monta a query string do período, para os links e o seletor. */
export function paramsDoPeriodo(p: Periodo) {
  const sp = new URLSearchParams()
  if (p.preset) {
    if (p.preset !== PRESET_PADRAO) sp.set('p', p.preset)
  } else {
    sp.set('de', p.de)
    sp.set('ate', p.ate)
  }
  return sp
}
