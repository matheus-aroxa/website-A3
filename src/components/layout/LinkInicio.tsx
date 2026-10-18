'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/** Link para a home que, já estando nela, rola suavemente até o topo (e limpa o #âncora da URL). */
export function LinkInicio(props: Omit<ComponentProps<typeof Link>, 'href'>) {
  const caminho = usePathname()
  return (
    <Link
      {...props}
      href="/"
      onClick={(e) => {
        props.onClick?.(e)
        if (caminho !== '/') return
        e.preventDefault()
        const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'instant' : 'smooth' })
        if (window.location.hash) history.replaceState(history.state, '', '/')
      }}
    />
  )
}
