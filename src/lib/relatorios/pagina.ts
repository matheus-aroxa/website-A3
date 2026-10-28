// Contexto comum às páginas de relatórios: confere o administrador, lê o período da URL e informa se a medição tem dados.
import 'server-only'
import { exigirAdmin } from '@/lib/admin/acesso'
import { coletaAtiva } from '@/lib/coleta/ativa'
import { hojeEmRecife } from '@/lib/coleta/dia'
import { lerPeriodo, periodoAnterior, type Periodo } from './periodo'
import { atualizarResumo, intervaloDosDados } from './resumo'

export type ParametrosDaPagina = Promise<Record<string, string | string[] | undefined>>

export interface ContextoDoRelatorio {
  periodo: Periodo
  anterior: Periodo
  /** A pessoa quer comparar com o período anterior (caixa marcada). */
  compararPedido: boolean
  /** Comparação possível: o período anterior inteiro tem medição. É este que as páginas usam. */
  comparar: boolean
  hoje: string
  /** Primeiro dia com dados da medição (`null` se ainda não há nenhum). */
  primeiroDia: string | null
  medicaoLigada: boolean
}

/** Erro do Postgres "tabela não existe": a migração db/relatorios.sql ainda não foi aplicada. */
export const tabelasAusentes = (erro: unknown) => typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '42P01'

/**
 * `medicao` falso: a página não usa as visitas (catálogo, qualidade, atividade do painel), então nada da medição é consultado e
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
  const anterior = periodoAnterior(periodo)
  const compararPedido = um('cmp') !== '0'
  // Antes da medição não há visitas: comparar com esses dias mostraria um crescimento que não existiu.
  const comparar = medicao && compararPedido && primeiroDia !== null && primeiroDia <= anterior.de
  return { periodo, anterior, compararPedido, comparar, hoje, primeiroDia, medicaoLigada: coletaAtiva() }
}
