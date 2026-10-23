'use client'

import { useEffect } from 'react'

/**
 * Leva ao topo, com transição suave, ao chegar na página vindo de outra (ex.: da busca da home). O Next só rola quando
 * o início da página nova está fora da tela, o que falha com o cabeçalho fixo e `router.push`, e às vezes começa uma
 * rolagem própria depois do primeiro commit. Por isso repete o pedido por menos de meio segundo (se já estiver no topo,
 * não faz nada). Roda só na montagem: mudar filtros dentro da própria página (que mantém o layout) não mexe na rolagem.
 */
export function TopoAoEntrar() {
  useEffect(() => {
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const topo = () => {
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'instant' : 'smooth' })
    }
    topo()
    const repeticoes = [120, 400].map((ms) => setTimeout(topo, ms))
    return () => repeticoes.forEach(clearTimeout)
  }, [])
  return null
}
