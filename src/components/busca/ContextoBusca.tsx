'use client'

// Estado da busca no navegador. A URL é a fonte da verdade (links compartilháveis e
// indexáveis); os controles respondem na hora via useOptimistic enquanto o servidor
// renderiza os novos resultados em segundo plano.

import { useRouter, useSearchParams } from 'next/navigation'
import { createContext, use, useMemo, useOptimistic, useState, useTransition } from 'react'
import {
  aplicarAlteracao,
  lerFiltros,
  limparFiltros,
  montarUrl,
  type Filtros,
  type FiltrosRota,
} from '@/lib/imoveis/filtros'
import type { Cidade, Construtora } from '@/lib/imoveis/tipos'

interface ValorBusca {
  filtros: Filtros
  cidades: Cidade[]
  construtoras: Construtora[]
  pendente: boolean
  aplicar: (alteracao: Partial<Filtros>) => void
  /** Troca todos os filtros de uma vez (usado pelo painel do celular ao tocar em "Aplicar"). */
  substituir: (novos: Filtros) => void
  limpar: () => void
  total: number | null
  registrarTotal: (total: number) => void
  painelAberto: boolean
  setPainelAberto: (aberto: boolean) => void
}

const Contexto = createContext<ValorBusca | null>(null)

export function useBusca() {
  const valor = use(Contexto)
  if (!valor) throw new Error('useBusca precisa estar dentro de <ProvedorBusca>')
  return valor
}

export function ProvedorBusca({
  rota,
  cidades,
  construtoras,
  children,
}: {
  rota: FiltrosRota
  cidades: Cidade[]
  construtoras: Construtora[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filtrosDaUrl = useMemo(() => lerFiltros(rota, searchParams).filtros, [rota, searchParams])
  const [filtros, setFiltrosOtimistas] = useOptimistic(filtrosDaUrl)
  const [pendente, iniciarTransicao] = useTransition()
  const [total, setTotal] = useState<number | null>(null)
  const [painelAberto, setPainelAberto] = useState(false)

  const valor = useMemo<ValorBusca>(() => {
    const navegar = (novos: Filtros) =>
      iniciarTransicao(() => {
        setFiltrosOtimistas(novos)
        router.replace(montarUrl(novos), { scroll: false })
      })
    return {
      filtros,
      cidades,
      construtoras,
      pendente,
      aplicar: (alteracao) => navegar(aplicarAlteracao(filtros, alteracao)),
      substituir: navegar,
      limpar: () => navegar(limparFiltros(filtros)),
      total,
      registrarTotal: setTotal,
      painelAberto,
      setPainelAberto,
    }
  }, [filtros, cidades, construtoras, pendente, total, painelAberto, router, setFiltrosOtimistas])

  return <Contexto value={valor}>{children}</Contexto>
}
