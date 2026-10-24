import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EditorVitrine } from '@/components/admin/EditorVitrine'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { obterVitrineAdmin } from '@/lib/admin/catalogo'
import { DESTAQUES_POR_VEZ, LIMITE_DESTAQUES } from '@/lib/imoveis/repositorio'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Vitrine da home' }

async function Vitrine() {
  const { vitrine, opcoes } = await obterVitrineAdmin()
  return <EditorVitrine inicial={vitrine} opcoes={opcoes} limite={LIMITE_DESTAQUES} porVez={DESTAQUES_POR_VEZ} />
}

export default function PaginaVitrine() {
  return (
    <>
      <TopoPagina
        titulo="Vitrine da home"
        descricao="Escolha o imóvel do topo da página inicial e os destaques. Só imóveis publicados entram."
      />
      <CorpoPagina estreito>
        <Suspense fallback={<p className={s.contagem}>Carregando…</p>}>
          <Vitrine />
        </Suspense>
      </CorpoPagina>
    </>
  )
}
