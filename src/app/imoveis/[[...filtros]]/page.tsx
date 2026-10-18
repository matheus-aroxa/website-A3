import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Paginacao } from '@/components/busca/Paginacao'
import { CarregarMais, ResumoResultados, SemResultados } from '@/components/busca/Resultados'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { JsonLd } from '@/components/seo/JsonLd'
import { POR_PAGINA, caminhoDaRota, interpretarSegmentos, lerFiltros, montarUrl, montarUrlApi } from '@/lib/imoveis/filtros'
import { buscarImoveis, contarPorRota, listarCidades } from '@/lib/imoveis/repositorio'
import { textosDaBusca } from '@/lib/imoveis/rotas'
import { schemaListaImoveis } from '@/lib/seo'
import { imagemCompartilhamento } from '@/lib/site'
import s from '@/components/busca/Busca.module.css'

type Props = PageProps<'/imoveis/[[...filtros]]'>

// Metadados dependem só do caminho (estáticos, ficam no <head> do HTML inicial).
// Variações por query (?quartos=2, ?pagina=3...) apontam o canonical para a página limpa.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ filtros: segmentos }, cidades] = await Promise.all([params, listarCidades()])
  const rota = interpretarSegmentos(segmentos, cidades)
  if (!rota) return {}
  const { tituloSeo, descricao } = textosDaBusca(rota, cidades)
  const canonical = caminhoDaRota(rota)
  const total = await contarPorRota(rota)
  return {
    title: tituloSeo,
    description: descricao,
    alternates: { canonical },
    openGraph: { title: tituloSeo, description: descricao, url: canonical, images: [imagemCompartilhamento] },
    // Busca sem resultados não deve ser indexada (evita "soft 404").
    ...(total === 0 && { robots: { index: false, follow: true } }),
  }
}

export default function PaginaBusca(props: Props) {
  return (
    <Suspense fallback={null}>
      <Resultados {...props} />
    </Suspense>
  )
}

async function Resultados({ params, searchParams }: Props) {
  const [{ filtros: segmentos }, query, cidades] = await Promise.all([params, searchParams, listarCidades()])
  const rota = interpretarSegmentos(segmentos, cidades)
  if (!rota) notFound()
  const { filtros, pagina } = lerFiltros(rota, query)
  const { itens, total, pagina: atual, totalPaginas } = await buscarImoveis(filtros, pagina)
  const temProxima = atual < totalPaginas

  return (
    <>
      <ResumoResultados total={total} />
      {total === 0 ? (
        <SemResultados />
      ) : (
        <>
          <div className={s.grade}>
            {itens.map((im, i) => (
              <CardImovel key={im.id} imovel={im} nivelTitulo={2} prioritario={i < 2} />
            ))}
          </div>
          <CarregarMais
            key={montarUrl(filtros, atual)}
            urlProxima={temProxima ? montarUrl(filtros, atual + 1) : null}
            apiProxima={temProxima ? montarUrlApi(filtros, atual + 1) : null}
            exibidos={(atual - 1) * POR_PAGINA + itens.length}
            total={total}
          />
          <Paginacao filtros={filtros} pagina={atual} totalPaginas={totalPaginas} />
          <JsonLd dados={schemaListaImoveis(itens, (atual - 1) * POR_PAGINA + 1)} />
        </>
      )}
    </>
  )
}
