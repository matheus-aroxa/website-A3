'use client'

import { useEffect } from 'react'

/** Anima a rolagem até o topo ao chegar por um link do rodapé (que navega com scroll={false}). */
export function RolarAoTopo() {
  useEffect(() => {
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'instant' : 'smooth' })
  }, [])
  return null
}
