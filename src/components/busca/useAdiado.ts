'use client'

import { useCallback, useEffect, useRef } from 'react'

/** Executa `fn` depois de `ms` sem novas chamadas, sempre com a versão mais recente de `fn`. */
export function useAdiado<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  const fnAtual = useRef(fn)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    fnAtual.current = fn
  })
  useEffect(() => () => clearTimeout(espera.current), [])

  const agendar = useCallback(
    (...args: A) => {
      clearTimeout(espera.current)
      espera.current = setTimeout(() => fnAtual.current(...args), ms)
    },
    [ms]
  )
  const cancelar = useCallback(() => clearTimeout(espera.current), [])
  return [agendar, cancelar] as const
}
