// Leituras da medição de uso para os relatórios: tudo vem do resumo diário (tabela `resumo_diario`), nunca dos eventos brutos.
// Cada função confere o administrador e atualiza o resumo antes de ler (no máximo uma vez a cada 30 s).
import 'server-only'
import { exigirAdmin } from '@/lib/admin/acesso'
import { banco } from '@/lib/db'
import { listarDias, type Periodo } from './periodo'
import { atualizarResumo } from './resumo'

export interface Medidas {
  visitas: number
  visitantes: number
  sessoes: number
  rejeicoes: number
  conversoes: number
  eventos: number
  tempo_s: number
  valor: number
}

export type Medida = keyof Medidas
export interface PontoDia extends Medidas {
  dia: string
}
export interface LinhaDimensao extends Medidas {
  chave: string
}

const MEDIDAS: Medida[] = ['visitas', 'visitantes', 'sessoes', 'rejeicoes', 'conversoes', 'eventos', 'tempo_s', 'valor']
const SOMAS = MEDIDAS.map((m) => `COALESCE(sum(${m}), 0)::float8 AS ${m}`).join(', ')

export const vazio = (): Medidas => ({ visitas: 0, visitantes: 0, sessoes: 0, rejeicoes: 0, conversoes: 0, eventos: 0, tempo_s: 0, valor: 0 })

export function somar(linhas: Medidas[]): Medidas {
  const total = vazio()
  for (const l of linhas) for (const m of MEDIDAS) total[m] += l[m]
  return total
}

async function preparar() {
  await exigirAdmin()
  await atualizarResumo(30)
}

/** Uma linha por dia do período (dias sem visita vêm zerados). */
export async function serieDiaria(p: Pick<Periodo, 'de' | 'ate'>): Promise<PontoDia[]> {
  await preparar()
  const { rows } = await banco().query<PontoDia>(
    `SELECT dia::text AS dia, ${MEDIDAS.map((m) => `${m}::float8 AS ${m}`).join(', ')}
       FROM resumo_diario WHERE dimensao = 'total' AND dia BETWEEN $1 AND $2`,
    [p.de, p.ate],
  )
  const porDia = new Map(rows.map((r) => [r.dia, r]))
  return listarDias(p).map((dia) => porDia.get(dia) ?? { dia, ...vazio() })
}

/** Soma por `chave` de uma dimensão no período, da maior para a menor `ordem`. */
export async function porDimensao(
  p: Pick<Periodo, 'de' | 'ate'>,
  dimensao: string,
  { limite = 1000, ordem = 'sessoes' }: { limite?: number; ordem?: Medida } = {},
): Promise<LinhaDimensao[]> {
  await preparar()
  const { rows } = await banco().query<LinhaDimensao>(
    `SELECT chave, ${SOMAS} FROM resumo_diario
      WHERE dimensao = $1 AND dia BETWEEN $2 AND $3
      GROUP BY chave ORDER BY sum(${MEDIDAS.includes(ordem) ? ordem : 'sessoes'}) DESC, chave LIMIT $4`,
    [dimensao, p.de, p.ate, limite],
  )
  return rows
}

/** Soma de uma dimensão inteira no período, sem o limite de `porDimensao`, e quantas chaves diferentes tiveram visita. */
export async function totalDaDimensao(p: Pick<Periodo, 'de' | 'ate'>, dimensao: string): Promise<Medidas & { chaves: number }> {
  await preparar()
  const { rows } = await banco().query<Medidas & { chaves: number }>(
    `SELECT (count(DISTINCT chave) FILTER (WHERE visitas > 0))::int AS chaves, ${SOMAS} FROM resumo_diario
      WHERE dimensao = $1 AND dia BETWEEN $2 AND $3`,
    [dimensao, p.de, p.ate],
  )
  return rows[0] ?? { chaves: 0, ...vazio() }
}

/** Visitas por dia da semana (0 = domingo) e hora (0-23), para o mapa de calor. */
export async function visitasPorHoraESemana(p: Pick<Periodo, 'de' | 'ate'>) {
  await preparar()
  const { rows } = await banco().query<{ dia_semana: number; hora: number; visitas: number }>(
    `SELECT extract(dow FROM dia)::int AS dia_semana, chave::int AS hora, sum(visitas)::float8 AS visitas
       FROM resumo_diario WHERE dimensao = 'hora' AND dia BETWEEN $1 AND $2 GROUP BY 1, 2`,
    [p.de, p.ate],
  )
  const grade = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const r of rows) grade[r.dia_semana]![r.hora] = r.visitas
  return grade
}

/** Soma de um tipo de ação (começo da chave, ex.: "whatsapp") por dia, para a série de conversões. */
export async function eventosPorDia(p: Pick<Periodo, 'de' | 'ate'>, tipos: string[]) {
  await preparar()
  const { rows } = await banco().query<{ dia: string; eventos: number }>(
    `SELECT dia::text AS dia, sum(eventos)::float8 AS eventos FROM resumo_diario
      WHERE dimensao = 'acao' AND dia BETWEEN $1 AND $2 AND split_part(chave, ':', 1) = ANY($3) GROUP BY dia`,
    [p.de, p.ate, tipos],
  )
  const porDia = new Map(rows.map((r) => [r.dia, r.eventos]))
  return listarDias(p).map((dia) => ({ dia, eventos: porDia.get(dia) ?? 0 }))
}
