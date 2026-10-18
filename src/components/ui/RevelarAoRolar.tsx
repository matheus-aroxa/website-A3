'use client'

import { useEffect } from 'react'

/**
 * Revela com animação os elementos marcados com `data-revelar` (o próprio elemento)
 * ou `data-revelar-filhos` (cada filho, em cascata) quando entram na tela.
 */
export function RevelarAoRolar() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const alvos = document.querySelectorAll<HTMLElement>('[data-revelar], [data-revelar-filhos]')

    document.querySelectorAll<HTMLElement>('[data-revelar-filhos]').forEach((grupo) => {
      Array.from(grupo.children).forEach((filho, i) => {
        ;(filho as HTMLElement).style.setProperty('--atraso', `${i * 120}ms`)
      })
    })

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.classList.add('revelado')
          observador.unobserve(e.target)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    alvos.forEach((el) => observador.observe(el))
    document.documentElement.setAttribute('data-revelar-ativo', '')

    return () => {
      observador.disconnect()
      document.documentElement.removeAttribute('data-revelar-ativo')
    }
  }, [])
  return null
}
