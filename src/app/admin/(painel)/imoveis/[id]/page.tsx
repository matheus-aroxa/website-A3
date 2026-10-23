import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FormularioImovel, Publicacao } from '@/components/admin/FormularioImovel'
import { CorpoPagina, Secao, TopoPagina } from '@/components/admin/TopoPagina'
import { Icone } from '@/components/ui/Icone'
import { obterImovelAdmin } from '@/lib/admin/catalogo'
import { etiquetaImovel } from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Editar imóvel' }

const VOLTAR = { href: '/admin', rotulo: 'Todos os imóveis' }

const STATUS = {
  ativo: 'Publicado',
  inativo: 'Desativado',
  excluido: 'Excluído',
}

async function Edicao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await obterImovelAdmin(id)
  if (!dados) notFound()
  const { imovel: im, status, editado } = dados
  const classe = im.finalidade === 'aluguel' ? 'aluguel' : im.situacao

  return (
    <>
      <TopoPagina
        voltar={VOLTAR}
        titulo={im.nome}
        descricao={`${im.local.bairro}, ${im.local.cidade} – ${im.local.uf}`}
        etiquetas={
          <>
            <span className={`etiqueta etiqueta-${classe} ${s.etiquetaP}`}>{etiquetaImovel(im)}</span>
            <span className={s.etiquetaTopo}>Cód. {im.codigo}</span>
            <span className={s.etiquetaTopo}>
              <span className={s.ponto} data-status={status} aria-hidden="true" />
              {STATUS[status]}
            </span>
          </>
        }
      >
        {status === 'ativo' && (
          <a href={urlImovel(im.slug)} target="_blank" rel="noopener" className={s.verNoSite}>
            Ver no site <Icone nome="externo" tamanho={16} />
          </a>
        )}
      </TopoPagina>

      {status === 'excluido' ? (
        <CorpoPagina estreito>
          <Secao icone={<Icone nome="lixeira" />} titulo="Imóvel excluído" descricao="Ele não aparece no site, na busca nem na vitrine. Restaure para voltar a editá-lo.">
            <Publicacao imovel={im} status={status} editado={editado} />
          </Secao>
        </CorpoPagina>
      ) : (
        <FormularioImovel imovel={im} status={status} editado={editado} />
      )}
    </>
  )
}

export default function PaginaEdicao({ params }: PageProps<'/admin/imoveis/[id]'>) {
  return (
    <Suspense fallback={<TopoPagina voltar={VOLTAR} titulo="Carregando imóvel…" />}>
      <Edicao params={params} />
    </Suspense>
  )
}
