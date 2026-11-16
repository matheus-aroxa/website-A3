import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FormularioImovel } from '@/components/admin/FormularioImovel'
import { TopoPagina } from '@/components/admin/TopoPagina'
import { listarConstrutorasDoPainel } from '@/lib/admin/catalogo'

export const metadata: Metadata = { title: 'Novo imóvel' }

async function Cadastro() {
  return <FormularioImovel construtoras={await listarConstrutorasDoPainel()} />
}

export default function PaginaNovoImovel() {
  return (
    <>
      <TopoPagina
        voltar={{ href: '/admin', rotulo: 'Todos os imóveis' }}
        titulo="Novo imóvel"
        descricao="Cadastre um imóvel novo. Ao cadastrar, ele já aparece no site."
      />
      <Suspense fallback={null}>
        <Cadastro />
      </Suspense>
    </>
  )
}
