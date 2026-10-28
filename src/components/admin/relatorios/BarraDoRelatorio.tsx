'use client'

// Período, comparação, exportação e impressão. O período vai na URL (?p=30d ou ?de=...&ate=...), então o link é compartilhável.
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import { PRESETS, PRESET_PADRAO, formatarDia, type Periodo } from '@/lib/relatorios/periodo'
import s from './Relatorios.module.css'

const PERSONALIZADO = 'personalizado'

function escaparCsv(valor: string) {
  return /[;"\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

/** Reúne as tabelas dos cartões da página (as escondidas também) em um CSV que o Excel em português abre direto. */
function exportarCsv(nome: string) {
  const linhas: string[][] = []
  document.querySelectorAll<HTMLElement>('[data-cartao]').forEach((cartao) => {
    cartao.querySelectorAll('table').forEach((tabela) => {
      linhas.push([cartao.dataset.titulo ?? 'Tabela'])
      tabela.querySelectorAll('tr').forEach((tr) => {
        linhas.push(
          [...tr.children].map((c) => {
            const v = (c as HTMLElement).dataset.v
            return v !== undefined && /^-?\d+(\.\d+)?$/.test(v) ? v.replace('.', ',') : (c.textContent ?? '').trim().replace(/\s+/g, ' ')
          }),
        )
      })
      linhas.push([])
    })
  })
  const csv = '﻿' + linhas.map((l) => l.map(escaparCsv).join(';')).join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = `${nome}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function BarraDoRelatorio({
  periodo,
  anterior,
  comparar,
  efetivo,
  comparavel,
  usaPeriodo,
  nomeArquivo,
  hoje,
}: {
  periodo: Periodo
  anterior: Periodo
  comparar: boolean
  /** Há medição em todo o período anterior, então a comparação aparece nos gráficos. */
  efetivo: boolean
  /** A página tem comparação com o período anterior. */
  comparavel: boolean
  /** Falso nas páginas do catálogo, que mostram o estado de hoje. */
  usaPeriodo: boolean
  nomeArquivo: string
  hoje: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [pendente, iniciar] = useTransition()
  const [de, setDe] = useState(periodo.de)
  const [ate, setAte] = useState(periodo.ate)
  const escolhido = periodo.preset ?? PERSONALIZADO

  function ir(mudar: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(params.toString())
    mudar(sp)
    iniciar(() => router.replace(`?${sp.toString()}`, { scroll: false }))
  }

  const aplicarPreset = (valor: string) =>
    ir((sp) => {
      sp.delete('de')
      sp.delete('ate')
      if (valor === PRESET_PADRAO) sp.delete('p')
      else sp.set('p', valor)
    })

  const aplicarDatas = (novoDe: string, novoAte: string) => {
    if (!novoDe || !novoAte) return
    ir((sp) => {
      sp.delete('p')
      sp.set('de', novoDe)
      sp.set('ate', novoAte)
    })
  }

  return (
    <div className={s.barra} aria-busy={pendente}>
      {usaPeriodo && (
        <>
          <div className={s.barraPeriodo}>
            <Seletor
              aria-label="Período"
              valor={escolhido}
              opcoes={[...PRESETS.map((p) => ({ valor: p.valor, rotulo: p.rotulo })), { valor: PERSONALIZADO, rotulo: 'Datas escolhidas…' }]}
              aoMudar={(v) => (v === PERSONALIZADO ? aplicarDatas(periodo.de, periodo.ate) : aplicarPreset(v))}
            />
          </div>
          {escolhido === PERSONALIZADO && (
            <div className={s.barraDatas}>
              <label>
                De
                <input type="date" value={de} max={hoje} onChange={(e) => { setDe(e.target.value); aplicarDatas(e.target.value, ate) }} />
              </label>
              <label>
                Até
                <input type="date" value={ate} max={hoje} onChange={(e) => { setAte(e.target.value); aplicarDatas(de, e.target.value) }} />
              </label>
            </div>
          )}
          {comparavel && (
            <label className={s.comparar}>
              <input type="checkbox" checked={comparar} onChange={(e) => ir((sp) => (e.target.checked ? sp.delete('cmp') : sp.set('cmp', '0')))} />
              Comparar com o período anterior
            </label>
          )}
        </>
      )}
      <div className={s.barraAcoes}>
        <button type="button" className={`${s.alternar}`} style={{ height: 44 }} onClick={() => exportarCsv(nomeArquivo)}>
          <Icone nome="baixar" tamanho={16} /> Exportar CSV
        </button>
        <button type="button" className={`${s.alternar}`} style={{ height: 44 }} onClick={() => window.print()}>
          <Icone nome="imprimir" tamanho={16} /> Imprimir
        </button>
      </div>
      {!usaPeriodo && <p className={s.barraResumo} style={{ flex: '1 1 240px', flexBasis: 'auto' }}>Retrato do cadastro em <strong>{formatarDia(hoje)}</strong>: mostra o que está publicado agora, não depende de período.</p>}
      {usaPeriodo && (
        <p className={s.barraResumo}>
          Mostrando <strong>{periodo.dias === 1 ? formatarDia(periodo.de) : `${formatarDia(periodo.de)} a ${formatarDia(periodo.ate)}`}</strong> ({periodo.dias} {periodo.dias === 1 ? 'dia' : 'dias'}).
          {comparavel && efetivo && <> Comparado com {formatarDia(anterior.de)} a {formatarDia(anterior.ate)}.</>} Dias de Recife.
        </p>
      )}
    </div>
  )
}
