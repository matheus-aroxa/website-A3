// Contexto comum às páginas de relatórios: confere o administrador, lê o período da URL e informa se a medição tem dados.
import 'server-only'
import { exigirAdmin } from '@/lib/admin/acesso'
import { hojeEmRecife } from '@/lib/coleta/dia'
import { lerPeriodo, type Periodo } from './periodo'
import { atualizarResumo, intervaloDosDados } from './resumo'

export type ParametrosDaPagina = Promise<Record<string, string | string[] | undefined>>

export interface ContextoDoRelatorio {
  periodo: Periodo
  hoje: string
  /** Primeiro dia com dados da medição (`null` se ainda não há nenhum). */
  primeiroDia: string | null
}

/** Erro do Postgres "tabela não existe": a migração db/relatorios.sql ainda não foi aplicada. */
export const tabelasAusentes = (erro: unknown) => typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '42P01'

/**
 * `medicao` falso: a página não usa as visitas (catálogo), então nada da medição é consultado e
 * ela funciona mesmo antes de db/relatorios.sql ser aplicado.
 */
export async function contextoDoRelatorio(parametros: ParametrosDaPagina, medicao = true): Promise<ContextoDoRelatorio> {
  await exigirAdmin()
  const sp = await parametros
  if (medicao) await atualizarResumo(30)
  const um = (chave: string) => (typeof sp[chave] === 'string' ? sp[chave] : undefined)
  const hoje = hojeEmRecife()
  const primeiroDia = medicao ? (await intervaloDosDados()).de : null
  const periodo = lerPeriodo({ p: um('p'), de: um('de'), ate: um('ate') }, hoje, primeiroDia)
  return { periodo, hoje, primeiroDia }
}
