// Indicadores do topo das páginas: valor grande e uma nota que explica o número.
import type { ReactNode } from 'react'
import s from './Relatorios.module.css'

export function Kpi({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: ReactNode }) {
  return (
    <div className={s.kpi}>
      <span className={s.kpiRotulo}>{rotulo}</span>
      <strong className={s.kpiValor} data-longo={valor.length > 7 || undefined}>{valor}</strong>
      {nota && <span className={s.kpiNota}>{nota}</span>}
    </div>
  )
}

/** Grade de indicadores. */
export function GradeKpi({ children }: { children: ReactNode }) {
  return <div className={s.kpis}>{children}</div>
}
