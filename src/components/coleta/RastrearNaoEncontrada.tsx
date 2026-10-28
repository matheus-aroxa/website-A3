'use client'

import { useEffect } from 'react'
import { registrar } from '@/lib/coleta/cliente'

/** Registra o 404 (link quebrado ou imóvel que saiu do ar) para o relatório de páginas não encontradas. */
export function RastrearNaoEncontrada() {
  useEffect(() => registrar('nao-encontrada'), [])
  return null
}
