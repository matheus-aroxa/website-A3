import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { NavegacaoRelatorios } from '@/components/admin/relatorios/Navegacao'
import { TopoPagina } from '@/components/admin/TopoPagina'
import { catalogoNoPainel, inicioDoPainel } from '@/lib/imoveis/fonte'

export const metadata: Metadata = { title: 'Relatórios' }

export default function LayoutRelatorios({ children }: { children: React.ReactNode }) {
  // Com o catálogo na Viniun (FONTE_IMOVEIS=viniun) não há relatórios no painel (o proxy já redireciona).
  if (!catalogoNoPainel()) redirect(inicioDoPainel())
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
