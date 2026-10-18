'use client'

import { useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import s from './Imovel.module.css'

const VISIVEIS_NO_CELULAR = 8

/** Todos os itens ficam no HTML (SEO); no celular os excedentes ficam recolhidos. */
export function Lazer({ itens }: { itens: string[] }) {
  const [aberto, setAberto] = useState(false)
  const excedente = itens.length > VISIVEIS_NO_CELULAR
  return (
    <>
      <ul className={s.lazer} id="lista-lazer" data-aberto={aberto || undefined}>
        {itens.map((item) => (
          <li key={item}>
            <span>
              <Icone nome="check" tamanho={15} espessura={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>
      {excedente && (
        <button
          type="button"
          className={`btn btn-linha btn-quadrado ${s.botaoLazer}`}
          aria-expanded={aberto}
          aria-controls="lista-lazer"
          onClick={() => setAberto((a) => !a)}
        >
          {aberto ? 'Mostrar menos' : `Ver os ${itens.length} itens de lazer`}
        </button>
      )}
    </>
  )
}
