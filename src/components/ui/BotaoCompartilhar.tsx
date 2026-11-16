'use client'

import { useState } from 'react'
import { Icone } from './Icone'

export const TEXTOS_COMPARTILHAR = { compartilhar: 'Compartilhar', copiado: 'Link copiado!' }

export function BotaoCompartilhar({
  className,
  titulo,
  textos = TEXTOS_COMPARTILHAR,
}: {
  className?: string
  titulo?: string
  textos?: typeof TEXTOS_COMPARTILHAR
}) {
  const [copiado, setCopiado] = useState(false)

  async function compartilhar() {
    const url = window.location.href.split('#')[0]!
    const dados = { title: titulo ?? document.title, url }
    try {
      if (navigator.share) {
        await navigator.share(dados)
        return
      }
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Usuário cancelou o compartilhamento: nada a fazer.
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-icone ${className ?? ''}`}
      aria-label={copiado ? textos.copiado : textos.compartilhar}
      title={copiado ? textos.copiado : textos.compartilhar}
      onClick={compartilhar}
      data-evento="compartilhar"
    >
      <Icone nome={copiado ? 'check' : 'compartilhar'} tamanho={19} espessura={copiado ? 2.4 : 1.8} />
    </button>
  )
}
