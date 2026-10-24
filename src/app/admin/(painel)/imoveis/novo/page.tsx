import type { Metadata } from 'next'
import { FormularioImovel } from '@/components/admin/FormularioImovel'
import { TopoPagina } from '@/components/admin/TopoPagina'

export const metadata: Metadata = { title: 'Novo imóvel' }

export default function PaginaNovoImovel() {
  return (
    <>
      <TopoPagina
        voltar={{ href: '/admin', rotulo: 'Todos os imóveis' }}
        titulo="Novo imóvel"
        descricao="Cadastre um imóvel novo. Ao cadastrar, ele já aparece no site."
      />
      <FormularioImovel />
    </>
  )
}
