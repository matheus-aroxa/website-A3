'use client'

import { useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import s from './Imovel.module.css'

const VISIVEIS_NO_CELULAR = 8

/** Todos os itens ficam no HTML (SEO); no celular os excedentes ficam recolhidos. */
/** `verTodos` leva {n} no lugar da quantidade. */
export const TEXTOS_LAZER = { menos: 'Mostrar menos', verTodos: 'Ver os {n} itens de lazer' }

export function Lazer({ itens, textos = TEXTOS_LAZER }: { itens: string[]; textos?: typeof TEXTOS_LAZER }) {
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
          {aberto ? textos.menos : textos.verTodos.replace('{n}', String(itens.length))}
        </button>
      )}
    </>
  )
}
