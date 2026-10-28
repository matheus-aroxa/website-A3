// Peças e contas que várias páginas de relatório usam.
import type { PontoDia, Medidas } from '@/lib/relatorios/audiencia'
import { fmtDuracao, fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import { DIAS_DA_SEMANA } from '@/lib/relatorios/rotulos'
import { diaDaSemana, formatarDia } from '@/lib/relatorios/periodo'
import type { PontoDeLinha } from './Graficos'
import type { ColunaDaTabela, LinhaDaTabela } from './Tabela'

export const taxas = (m: Medidas) => ({
  rejeicao: razao(m.rejeicoes, m.sessoes),
  conversao: razao(m.conversoes, m.sessoes),
  paginasPorSessao: razao(m.visitas, m.sessoes),
  duracao: razao(m.tempo_s, m.sessoes),
})

/** Série diária pronta para o gráfico de linha. */
export function pontosDeLinha(atual: PontoDia[], campo: (p: PontoDia) => number): PontoDeLinha[] {
  return atual.map((p) => ({
    rotulo: formatarDia(p.dia, true),
    rotuloLongo: `${DIAS_DA_SEMANA[diaDaSemana(p.dia)]}, ${formatarDia(p.dia)}`,
    valor: campo(p),
  }))
}

/** Colunas padrão de uma tabela de dimensão (origem, aparelho, página de entrada...). */
export const COLUNAS_DE_AUDIENCIA: ColunaDaTabela[] = [
  { id: 'chave', titulo: 'Item' },
  { id: 'sessoes', titulo: 'Sessões', numerica: true },
  { id: 'visitantes', titulo: 'Visitantes', numerica: true },
  { id: 'visitas', titulo: 'Páginas vistas', numerica: true },
  { id: 'rejeicao', titulo: 'Rejeição', numerica: true },
  { id: 'conversao', titulo: 'Contato', numerica: true },
]

export function linhaDeAudiencia(rotulo: LinhaDaTabela[string], m: Medidas): LinhaDaTabela {
  return {
    chave: rotulo,
    sessoes: { v: m.sessoes, t: fmtInt(m.sessoes) },
    visitantes: { v: m.visitantes, t: fmtInt(m.visitantes) },
    visitas: { v: m.visitas, t: fmtInt(m.visitas) },
    rejeicao: { v: razao(m.rejeicoes, m.sessoes), t: fmtPct(razao(m.rejeicoes, m.sessoes)) },
    conversao: { v: razao(m.conversoes, m.sessoes), t: fmtPct(razao(m.conversoes, m.sessoes)) },
  }
}

export { fmtDuracao }
