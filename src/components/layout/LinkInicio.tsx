'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/**
 * Link para a página inicial (a home ou, no painel, `/admin`) que, já estando nela,
 * rola suavemente até o topo (e limpa o #âncora da URL).
 */
export function LinkInicio({ href = '/', ...props }: Omit<ComponentProps<typeof Link>, 'href'> & { href?: string }) {
  const caminho = usePathname()
  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        props.onClick?.(e)
        if (caminho !== href) return
        e.preventDefault()
        const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'instant' : 'smooth' })
        if (window.location.hash) history.replaceState(history.state, '', href)
      }}
    />
  )
}
