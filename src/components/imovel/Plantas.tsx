'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatarArea } from '@/lib/imoveis/formato'
import type { Planta } from '@/lib/imoveis/tipos'
import s from './Imovel.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

/** Desktop: grade com todas as plantas. Celular: uma planta grande + seletor (protótipo mobile). */
export function Plantas({ plantas }: { plantas: Planta[] }) {
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
                {p.descricao} · {formatarArea({ min: p.area, max: p.area })}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={`${s.seletorPlantas} carrossel-mobile`} role="group" aria-label="Escolher planta">
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
              {p.descricao} · {formatarArea({ min: p.area, max: p.area })}
            </span>
          </button>
        ))}
      </div>
      <p className={s.notaPlantas}>Plantas ilustrativas. Medidas sujeitas a alteração conforme o projeto da construtora.</p>
    </>
  )
}
