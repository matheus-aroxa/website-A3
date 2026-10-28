'use client'

// Período do relatório. Ele vai na URL (?p=30d ou ?de=...&ate=...), então o link é compartilhável.
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Seletor } from '@/components/ui/Seletor'
import { PRESETS, PRESET_PADRAO, formatarDia, type Periodo } from '@/lib/relatorios/periodo'
import s from './Relatorios.module.css'

const PERSONALIZADO = 'personalizado'

export function BarraDoRelatorio({
  periodo,
  hoje,
}: {
  periodo: Periodo
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
      <div className={s.barraPeriodo}>
        <span className={s.barraNome} aria-hidden="true">Período</span>
        <Seletor
          aria-label="Período"
          valor={escolhido}
          opcoes={[...PRESETS.map((p) => ({ valor: p.valor, rotulo: p.rotulo })), { valor: PERSONALIZADO, rotulo: 'Personalizado' }]}
          aoMudar={(v) => (v === PERSONALIZADO ? aplicarDatas(periodo.de, periodo.ate) : aplicarPreset(v))}
        />
      </div>
      {escolhido === PERSONALIZADO && (
        <div className={s.barraDatas}>
          <label>
            <span className={s.barraNome}>De</span>
            <input type="date" value={de} max={hoje} onChange={(e) => { setDe(e.target.value); aplicarDatas(e.target.value, ate) }} />
          </label>
          <label>
            <span className={s.barraNome}>Até</span>
            <input type="date" value={ate} max={hoje} onChange={(e) => { setAte(e.target.value); aplicarDatas(de, e.target.value) }} />
          </label>
        </div>
      )}
      <p className={s.barraResumo}>
        Mostrando <strong>{periodo.dias === 1 ? formatarDia(periodo.de) : `${formatarDia(periodo.de)} a ${formatarDia(periodo.ate)}`}</strong> ({periodo.dias} {periodo.dias === 1 ? 'dia' : 'dias'}).
      </p>
    </div>
  )
}
