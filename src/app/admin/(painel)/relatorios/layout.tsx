import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NavegacaoRelatorios } from '@/components/admin/relatorios/Navegacao'
import { TopoPagina } from '@/components/admin/TopoPagina'

export const metadata: Metadata = { title: 'Relatórios' }

export default function LayoutRelatorios({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopoPagina titulo="Relatórios" descricao="Cadastro, visitas, buscas e contatos do site, com gráficos, comparação entre períodos e exportação." />
      <Suspense fallback={<div style={{ height: 55, background: '#fff', borderBottom: '1px solid var(--borda-2)' }} />}>
        <NavegacaoRelatorios />
      </Suspense>
      {children}
    </>
  )
}
