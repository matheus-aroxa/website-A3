'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatarArea } from '@/lib/imoveis/formato'
import type { Planta } from '@/lib/imoveis/tipos'
import s from './Imovel.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

/** Desktop: grade com todas as plantas. Celular: uma planta grande + seletor (protótipo mobile). */
export const TEXTOS_PLANTAS = {
  escolher: 'Escolher planta',
  nota: 'Plantas ilustrativas. Medidas sujeitas a alteração conforme o projeto da construtora.',
}

export function Plantas({
  plantas,
  textos = TEXTOS_PLANTAS,
  locale,
}: {
  plantas: Planta[]
  textos?: typeof TEXTOS_PLANTAS
  /** Formato da área ("51,7 m²" em português, "51.7 m²" em inglês). */
  locale?: string
}) {
  const area = (m2: number) => (locale ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(m2)} m²` : formatarArea({ min: m2, max: m2 }))
  const [selecionada, setSelecionada] = useState(0)
  return (
    <>
      <div className={s.plantas}>
        {plantas.map((p, i) => (
          <figure key={p.foto.src} className={s.planta} data-selecionada={i === selecionada || undefined}>
            <div className={s.plantaImagem}>
              <Image loader={carregadorImagem} src={p.foto.src} alt={p.foto.alt} fill sizes="(max-width: 767px) 100vw, 300px" />
            </div>
            <figcaption>
              <strong>{p.titulo}</strong>
              <span>
                {p.descricao} · {area(p.area)}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={`${s.seletorPlantas} carrossel-mobile`} role="group" aria-label={textos.escolher}>
        {plantas.map((p, i) => (
          <button
            key={p.foto.src}
            type="button"
            className="alternancia"
            aria-pressed={i === selecionada}
            onClick={() => setSelecionada(i)}
            data-evento="planta"
            data-rotulo="selecionar"
          >
            <strong>{p.titulo}</strong>
            <span>
              {p.descricao} · {area(p.area)}
            </span>
          </button>
        ))}
      </div>
      <p className={s.notaPlantas}>{textos.nota}</p>
    </>
  )
}
