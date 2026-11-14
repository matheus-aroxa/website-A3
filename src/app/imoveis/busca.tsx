// A busca de imóveis (/imoveis e /imoveis/[categoria]/[tipo]/[cidade]/[bairro]): layout, página e metadados.
// São duas rotas, /imoveis (imoveis/(inicio)) e /imoveis/... (imoveis/[...filtros]), e não uma só com [[...filtros]]:
// com o segmento opcional vazio, depois de mudar só a query em /imoveis (ex.: ?quartos=2), escolher uma cidade levava a
// /imoveis/recife?quartos=2 com o título novo e a lista antiga: o roteador do Next reaproveitava a página anterior
// (visto no 16.4.2 e no 16.4.6). Com /imoveis numa rota própria isso não acontece.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BarraFerramentas } from '@/components/busca/BarraFerramentas'
import { ProvedorBusca } from '@/components/busca/ContextoBusca'
import { PainelFiltros } from '@/components/busca/PainelFiltros'
import { Paginacao } from '@/components/busca/Paginacao'
import { AreaResultados, CarregarMais, ResumoResultados, SemResultados } from '@/components/busca/Resultados'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { JsonLd } from '@/components/seo/JsonLd'
import { Migalhas } from '@/components/ui/Migalhas'
import { POR_PAGINA, caminhoDaRota, interpretarSegmentos, lerFiltros, montarUrl, montarUrlApi } from '@/lib/imoveis/filtros'
import { semIndexacao } from '@/lib/imoveis/paginas'
import { buscarImoveis, listarCidades, listarConstrutoras, listarPaginasDeBusca } from '@/lib/imoveis/repositorio'
import { migalhasDaBusca, textosDaBusca } from '@/lib/imoveis/rotas'
import { schemaColecao, schemaListaImoveis } from '@/lib/seo'
import { imagemCompartilhamento, openGraphBase } from '@/lib/site'
import s from '@/components/busca/Busca.module.css'

/** Segmentos do caminho depois de /imoveis (vazio em /imoveis). */
export type Segmentos = Promise<string[] | undefined>
type Props = { segmentos: Segmentos; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function LayoutBusca({ segmentos: pedidoSegmentos, children }: { segmentos: Segmentos; children: React.ReactNode }) {
  const [segmentos, cidades, construtoras, paginas] = await Promise.all([
    pedidoSegmentos,
    listarCidades(),
    listarConstrutoras(),
    listarPaginasDeBusca(),
  ])
  const rota = interpretarSegmentos(segmentos, cidades)
  if (!rota) notFound()
  const caminho = caminhoDaRota(rota)
  const pagina = paginas.find((p) => p.caminho === caminho)
  const { h1, subtitulo, descricao } = textosDaBusca(rota, cidades, pagina)

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <main id="conteudo">
        <section className={s.topo}>
          <div className={`container ${s.titulos}`}>
            <Migalhas itens={migalhasDaBusca(rota, cidades)} />
            <h1>{h1}</h1>
            <p>{subtitulo}</p>
          </div>
        </section>

        {/* Filtros dependem da query (?quartos=2...), então chegam por streaming logo após o shell. */}
        <Suspense fallback={<EsqueletoBusca />}>
          <ProvedorBusca rota={rota} cidades={cidades} construtoras={construtoras}>
            <div className={s.topoBarra}>
              <div className="container">
                <BarraFerramentas />
              </div>
            </div>
            <section className={s.corpo} aria-label="Resultados da busca">
              <div className={`container ${s.corpoGrade}`}>
                <PainelFiltros />
                <AreaResultados>{children}</AreaResultados>
              </div>
            </section>
          </ProvedorBusca>
        </Suspense>
      </main>
      <JsonLd dados={schemaColecao({ nome: h1, descricao, caminho: pagina?.canonico ?? caminho })} />
      <Rodape />
      <BotaoWhatsApp />
    </>
  )
}

function EsqueletoBusca() {
  return (
    <>
      <div className={s.topoBarra}>
        <div className="container">
          <div className={s.esqueleto} style={{ height: 52, borderRadius: 12 }} />
        </div>
      </div>
      <section className={s.corpo} aria-hidden="true">
        <div className={`container ${s.corpoGrade}`}>
          <div className={`${s.painel} ${s.esqueleto}`} style={{ height: 640 }} />
          <div className={s.resultados}>
            <div className={s.esqueleto} style={{ height: 36, width: 220 }} />
            <div className={s.grade}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={s.esqueleto} style={{ height: 420 }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// Metadados dependem só do caminho (estáticos, ficam no <head> do HTML inicial).
// Variações por query (?quartos=2, ?pagina=3...) apontam o canonical para a página limpa.
// Caminhos que mostram os mesmos imóveis apontam para a página principal do conjunto (ver lib/imoveis/paginas.ts).
export async function metadadosDaBusca(pedidoSegmentos: Segmentos): Promise<Metadata> {
  const [segmentos, cidades, paginas] = await Promise.all([pedidoSegmentos, listarCidades(), listarPaginasDeBusca()])
  const rota = interpretarSegmentos(segmentos, cidades)
  if (!rota) return {}
  const caminho = caminhoDaRota(rota)
  const pagina = paginas.find((p) => p.caminho === caminho)
  const { tituloSeo, descricao } = textosDaBusca(rota, cidades, pagina)
  const canonical = pagina?.canonico ?? caminho
  return {
    title: { absolute: tituloSeo },
    description: descricao,
    alternates: { canonical },
    openGraph: { ...openGraphBase, title: tituloSeo, description: descricao, url: canonical, images: [imagemCompartilhamento] },
    // Busca sem resultados (evita "soft 404") ou com poucos imóveis não deve ser indexada.
    ...(semIndexacao(pagina) && { robots: { index: false, follow: true } }),
  }
}

export function PaginaBusca(props: Props) {
  return (
    <Suspense fallback={null}>
      <Resultados {...props} />
    </Suspense>
  )
}

async function Resultados({ segmentos: pedidoSegmentos, searchParams }: Props) {
  const [segmentos, query, cidades] = await Promise.all([pedidoSegmentos, searchParams, listarCidades()])
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
              <CardImovel key={im.id} imovel={im} nivelTitulo={2} prioritario={i < 2} lista="busca" />
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
