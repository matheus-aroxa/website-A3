import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Artigo } from '@/components/internacional/Artigo'
import { CabecalhoInternacional } from '@/components/internacional/CabecalhoInternacional'
import { CardInternacional } from '@/components/internacional/CardInternacional'
import sb from '@/components/busca/Busca.module.css'
import pt from '@/components/layout/PaginaTexto.module.css'
import { ListaImoveis, type ItemLista } from '@/components/internacional/ListaImoveis'
import { RodapeInternacional } from '@/components/internacional/RodapeInternacional'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Migalhas } from '@/components/ui/Migalhas'
import { JsonLd } from '@/components/seo/JsonLd'
import { listarImoveisInternacionais } from '@/lib/internacional/catalogo'
import { obterCotacoes } from '@/lib/internacional/cotacao'
import {
  DADOS_IDIOMA,
  IDIOMAS,
  alternativas,
  ehIdioma,
  secaoDoCaminho,
  urlInicio,
  urlSecao,
  versoes,
  type Idioma,
  type Secao,
} from '@/lib/internacional/idiomas'
import { conteudo, dicionario } from '@/lib/internacional/textos'
import { imagemCompartilhamento, linkWhatsApp, site, urlAbsoluta } from '@/lib/site'
import { ID_ORGANIZACAO } from '@/lib/seo'

// Uma rota para as três seções de cada idioma, porque o endereço muda com o idioma: /en/properties, /it/immobili,
// /en/buying-property-in-brazil… `secaoDoCaminho` diz qual é qual.

export const ensureStatic = 'navigation'

export async function generateStaticParams({ params }: { params: { idioma: string } }) {
  const idiomas = ehIdioma(params.idioma) ? [params.idioma] : IDIOMAS
  return idiomas.flatMap((idioma) => Object.values(DADOS_IDIOMA[idioma].caminhos).map((secao) => ({ idioma, secao })))
}

function resolver(idioma: string, segmento: string): { idioma: Idioma; secao: Secao } | null {
  if (!ehIdioma(idioma)) return null
  const secao = secaoDoCaminho(idioma, segmento)
  return secao ? { idioma, secao } : null
}

function textosSeo(idioma: Idioma, secao: Secao) {
  const d = dicionario(idioma)
  if (secao === 'imoveis') return { titulo: d.imoveis.tituloSeo, descricao: d.imoveis.descricaoSeo }
  const artigo = conteudo(idioma)[secao]
  return { titulo: artigo.tituloSeo, descricao: artigo.descricaoSeo }
}

export async function generateMetadata({ params }: PageProps<'/[idioma]/[secao]'>): Promise<Metadata> {
  const p = await params
  const r = resolver(p.idioma, p.secao)
  if (!r) return {}
  const { titulo, descricao } = textosSeo(r.idioma, r.secao)
  const url = urlSecao(r.idioma, r.secao)
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url, languages: alternativas((i) => urlSecao(i, r.secao)) },
    openGraph: {
      type: r.secao === 'imoveis' ? 'website' : 'article',
      locale: DADOS_IDIOMA[r.idioma].ogLocale,
      siteName: site.nome,
      url,
      title: titulo,
      description: descricao,
      images: [imagemCompartilhamento],
    },
  }
}

export default async function SecaoInternacional({ params }: PageProps<'/[idioma]/[secao]'>) {
  const p = await params
  const r = resolver(p.idioma, p.secao)
  if (!r) notFound()
  const { idioma, secao } = r
  const d = dicionario(idioma)
  const migalhas = [
    { nome: d.nav.inicio, href: urlInicio(idioma) },
    { nome: secao === 'imoveis' ? d.nav.imoveis : secao === 'privacidade' ? conteudo(idioma)[secao].titulo : conteudo(idioma)[secao].sobretitulo, href: urlSecao(idioma, secao) },
  ]

  return (
    <>
      <CabecalhoInternacional idioma={idioma} ativo={secao === 'privacidade' ? undefined : secao} versoes={versoes((i) => urlSecao(i, secao))} />
      <main id="conteudo">
        {secao === 'imoveis' ? (
          <ListaDeImoveis idioma={idioma} migalhas={migalhas} />
        ) : (
          <div className={`container ${pt.pagina}`}>
            <PaginaArtigo idioma={idioma} secao={secao} migalhas={<Migalhas itens={migalhas} rotulo={d.nav.voceEstaEm} />} />
          </div>
        )}
      </main>
      <RodapeInternacional idioma={idioma} />
      <BotaoWhatsApp mensagem={d.contato.mensagemPadrao} rotulo={d.nav.faleConosco} rotuloAcessivel={d.nav.faleConoscoWhatsApp} />
    </>
  )
}

/** Mesmo desenho da busca em português (app/(site)/imoveis/busca.tsx): topo com título, barra, filtros e resultados. */
async function ListaDeImoveis({ idioma, migalhas }: { idioma: Idioma; migalhas: { nome: string; href: string }[] }) {
  const d = dicionario(idioma)
  const [imoveis, cotacoes] = await Promise.all([listarImoveisInternacionais(), obterCotacoes()])
  const cotacao = cotacoes[DADOS_IDIOMA[idioma].moeda]
  const itens: ItemLista[] = imoveis.map((im, i) => ({
    slug: im.slug,
    nome: im.nome,
    codigo: im.codigo,
    cidade: im.local.cidade,
    cidadeSlug: im.cidadeSlug,
    tipo: im.tipo,
    situacao: im.situacao,
    quartos: im.quartos.max,
    banheiros: im.banheiros.max,
    vagas: im.vagas ? im.vagas.max : -1,
    preco: im.preco,
    area: im.area.max,
    card: <CardInternacional imovel={im} idioma={idioma} cotacao={cotacao} nivelTitulo={2} prioritario={i < 2} lista={`busca-${idioma}`} />,
  }))
  const caminho = urlSecao(idioma, 'imoveis')
  return (
    <>
      <section className={sb.topo}>
        <div className={`container ${sb.titulos}`}>
          <Migalhas itens={migalhas} rotulo={d.nav.voceEstaEm} />
          <h1>{d.imoveis.titulo}</h1>
          <p>{d.imoveis.intro}</p>
        </div>
      </section>
      <ListaImoveis
        itens={itens}
        textos={{ ...d.imoveis, tipos: d.imovel.tipo, situacoes: d.imovel.situacao }}
        whatsapp={linkWhatsApp(d.contato.mensagemPadrao)}
      />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${urlAbsoluta(caminho)}#colecao`,
          url: urlAbsoluta(caminho),
          name: d.imoveis.tituloSeo,
          description: d.imoveis.descricaoSeo,
          inLanguage: idioma,
          publisher: { '@id': ID_ORGANIZACAO },
        }}
      />
    </>
  )
}

function PaginaArtigo({ idioma, secao, migalhas }: { idioma: Idioma; secao: Exclude<Secao, 'imoveis'>; migalhas: React.ReactNode }) {
  const artigo = conteudo(idioma)[secao]
  const url = urlSecao(idioma, secao)
  return (
    <>
      <Artigo artigo={artigo} contato={`${urlInicio(idioma)}#contato`} migalhas={migalhas} />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': secao === 'privacidade' ? 'WebPage' : 'Article',
          '@id': `${urlAbsoluta(url)}#artigo`,
          url: urlAbsoluta(url),
          headline: artigo.titulo,
          description: artigo.descricaoSeo,
          inLanguage: idioma,
          dateModified: '2026-11-16',
          author: { '@id': ID_ORGANIZACAO },
          publisher: { '@id': ID_ORGANIZACAO },
        }}
      />
    </>
  )
}
