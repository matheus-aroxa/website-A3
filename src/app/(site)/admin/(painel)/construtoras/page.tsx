import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaConstrutoras } from '@/components/admin/ListaConstrutoras'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { listarConstrutorasDoPainel } from '@/lib/admin/catalogo'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Construtoras' }

async function Construtoras() {
  return <ListaConstrutoras construtoras={await listarConstrutorasDoPainel()} />
}

export default function PaginaConstrutoras() {
  return (
    <>
      <TopoPagina
        titulo="Construtoras"
        descricao='Cadastre as construtoras e escolha uma em cada imóvel. Imóvel sem construtora informada fica como "Não informado".'
      />
      <CorpoPagina>
        <Suspense fallback={<p className={s.contagem}>Carregando…</p>}>
          <Construtoras />
        </Suspense>
      </CorpoPagina>
    </>
  )
}
