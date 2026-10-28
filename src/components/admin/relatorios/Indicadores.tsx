// Indicadores do topo das páginas: valor grande, variação sobre o período anterior e uma mini evolução.
import type { ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import { fmtPct, type Variacao } from '@/lib/relatorios/formato'
import s from './Relatorios.module.css'

function Mini({ serie }: { serie: number[] }) {
  if (serie.length < 2) return null
  const max = Math.max(...serie, 1)
  const d = serie.map((v, i) => `${i ? 'L' : 'M'}${((i / (serie.length - 1)) * 100).toFixed(1)},${(26 - (v / max) * 24).toFixed(1)}`).join(' ')
  return (
    <svg className={s.mini} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--g-acento)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Delta({ v, subeEBom = true }: { v: Variacao; subeEBom?: boolean }) {
  if (v.fracao === null) return <span className={s.delta} data-bom="neutro"><span className={s.deltaBase}>Sem base de comparação</span></span>
  const sobe = v.fracao > 0
  const igual = Math.abs(v.fracao) < 0.005
  return (
    <span className={s.delta} data-bom={igual ? 'neutro' : sobe === subeEBom ? 'true' : 'false'}>
      {!igual && <Icone nome={sobe ? 'seta-cima' : 'seta-baixo'} tamanho={13} espessura={2.6} />}
      {igual ? 'Estável' : `${sobe ? '+' : '−'}${fmtPct(Math.abs(v.fracao))}`}
      <span className={s.deltaBase}>vs. período anterior</span>
    </span>
  )
}

export function Kpi({ rotulo, valor, nota, variacao, subeEBom, serie }: { rotulo: string; valor: string; nota?: ReactNode; variacao?: Variacao; subeEBom?: boolean; serie?: number[] }) {
  return (
    <div className={s.kpi}>
      <span className={s.kpiRotulo}>{rotulo}</span>
      <strong className={s.kpiValor} data-longo={valor.length > 7 || undefined}>{valor}</strong>
      {variacao && <Delta v={variacao} subeEBom={subeEBom} />}
      {nota && <span className={s.kpiNota}>{nota}</span>}
      {serie && <Mini serie={serie} />}
    </div>
  )
}

/** "11.358" → "11358" e "4,2" → "4.2": o número que a exportação em CSV leva, sem o formato de tela. */
const numeroBruto = (texto: string) => (/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(texto) ? texto.replace(/\./g, '').replace(',', '.') : undefined)

/** Grade de indicadores. A tabela escondida leva os mesmos números para a exportação em CSV. */
export function GradeKpi({ titulo, itens, children }: { titulo: string; itens: { rotulo: string; valor: string }[]; children: ReactNode }) {
  return (
    <div data-cartao data-titulo={titulo}>
      <div className={s.kpis}>{children}</div>
      <table hidden>
        <thead>
          <tr><th>Indicador</th><th>Valor</th></tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.rotulo}><th>{i.rotulo}</th><td data-v={numeroBruto(i.valor)}>{i.valor}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
