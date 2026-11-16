import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CabecalhoInternacional } from '@/components/internacional/CabecalhoInternacional'
import { CardInternacional } from '@/components/internacional/CardInternacional'
import { ContatoImovelInternacional } from '@/components/internacional/ContatoImovelInternacional'
import { DescricaoNavegador } from '@/components/internacional/DescricaoNavegador'
import si from '@/components/internacional/Internacional.module.css'
import { RodapeInternacional } from '@/components/internacional/RodapeInternacional'
import { Galeria } from '@/components/imovel/Galeria'
import s from '@/components/imovel/Imovel.module.css'
import { Lazer } from '@/components/imovel/Lazer'
import { Plantas } from '@/components/imovel/Plantas'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { JsonLd } from '@/components/seo/JsonLd'
import { BotaoCompartilhar } from '@/components/ui/BotaoCompartilhar'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { Migalhas } from '@/components/ui/Migalhas'
import { SITUACOES } from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import { SLUG_CONSTRUTORA_PADRAO } from '@/lib/imoveis/tipos'
import { fotosDoImovel, listarImoveisInternacionais, obterImovelInternacional } from '@/lib/internacional/catalogo'
import { obterCotacoes } from '@/lib/internacional/cotacao'
import { preencher } from '@/lib/internacional/dicionario'
import {
  formatarAproximado,
  formatarArea,
  formatarDataCotacao,
  formatarEntrega,
  formatarEntregaCurta,
  formatarFaixa,
  formatarQuartos,
  formatarReais,
} from '@/lib/internacional/formato'
import {
  DADOS_IDIOMA,
  IDIOMAS,
  alternativas,
  ehIdioma,
  secaoDoCaminho,
  urlImovelInternacional,
  urlInicio,
  urlSecao,
  versoes,
} from '@/lib/internacional/idiomas'
import { schemaAnuncioInternacional } from '@/lib/internacional/seo'
import { dicionario } from '@/lib/internacional/textos'
import { linkWhatsApp, site } from '@/lib/site'

// Ficha do imóvel na área internacional (/en/properties/<slug>, /it/immobili/<slug>…), com o mesmo desenho da ficha em
// português (app/(site)/imovel/[slug]/page.tsx, mesmo CSS). O slug é o mesmo de /imovel/<slug>, e as duas versões se
// apontam pelo hreflang e pelo seletor de idioma.

export const ensureStatic = 'navigation'

/**
 * Nenhuma ficha sai pronta no build: a tradução é feita só quando alguém abre a página (lib/internacional/traducao.ts).
 * Com ensureStatic, o Next exige ao menos um parâmetro por idioma; o marcador abaixo não é um imóvel e responde 404 sem
 * traduzir nada. As fichas de verdade são geradas no primeiro acesso e ficam em cache.
 */
export function generateStaticParams({ params }: { params: { idioma: string } }) {
  const idiomas = ehIdioma(params.idioma) ? [params.idioma] : IDIOMAS
  return idiomas.map((idioma) => ({ idioma, secao: DADOS_IDIOMA[idioma].caminhos.imoveis, slug: MARCADOR }))
}

const MARCADOR = '_'

async function carregar(params: PageProps<'/[idioma]/[secao]/[slug]'>['params']) {
  const { idioma, secao, slug } = await params
  if (!ehIdioma(idioma) || secaoDoCaminho(idioma, secao) !== 'imoveis' || slug === MARCADOR) return null
  const im = await obterImovelInternacional(slug, idioma)
  return im ? { idioma, im } : null
}

export async function generateMetadata({ params }: PageProps<'/[idioma]/[secao]/[slug]'>): Promise<Metadata> {
  const r = await carregar(params)
  if (!r) return { robots: { index: false } }
  const { idioma, im } = r
  const d = dicionario(idioma)
  const titulo = d.imovel.tituloSeo({ nome: im.nome, tipo: im.tipo, bairro: im.local.bairro, cidade: im.local.cidade })
  const descricao = d.imovel.descricaoSeo({
    nome: im.nome,
    tipo: im.tipo,
    quartos: im.tipo === 'terreno' ? null : formatarQuartos(im.quartos, d),
    area: formatarArea(im.area, idioma, d),
    bairro: im.local.bairro,
    cidade: im.local.cidade,
    preco: im.preco > 0 ? `${d.imovel.precoAPartirDe} ${formatarReais(im.preco, idioma, d)}` : d.imovel.sobConsulta,
  })
  const url = urlImovelInternacional(idioma, im.slug)
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url, languages: alternativas((i) => urlImovelInternacional(i, im.slug), urlImovel(im.slug)) },
    openGraph: {
      type: 'website',
      locale: DADOS_IDIOMA[idioma].ogLocale,
      siteName: site.nome,
      title: titulo,
      description: descricao,
      url,
      images: fotosDoImovel(im)
        .slice(0, 4)
        .map((f) => ({ url: f.src, width: f.width, height: f.height, alt: f.alt })),
    },
  }
}

export default async function ImovelInternacionalPagina({ params }: PageProps<'/[idioma]/[secao]/[slug]'>) {
  const r = await carregar(params)
  if (!r) notFound()
  const { idioma, im } = r
  const d = dicionario(idioma)
  const [cotacoes, todos] = await Promise.all([obterCotacoes(), listarImoveisInternacionais()])
  const cotacao = cotacoes[DADOS_IDIOMA[idioma].moeda]
  const aproximado = formatarAproximado(im.preco, idioma, cotacao, d)
  const mensagemWhats = preencher(d.imovel.mensagemWhatsApp, { nome: im.nome, codigo: im.codigo })
  const pronto = im.situacao === 'pronto'
  // Parecidos: da mesma cidade e do recorte internacional, os mais recentes (como os "Empreendimentos parecidos").
  const semelhantes = todos.filter((o) => o.slug !== im.slug && o.cidadeSlug === im.local.cidadeSlug).slice(0, 3)

  const vagas = !im.vagas ? d.imovel.vagaConsultar : im.vagas.max === 0 ? d.formato.semVaga : formatarFaixa(im.vagas, d)
  const quartos = im.suites?.max ? `${formatarFaixa(im.quartos, d)}, ${d.imovel.comSuite}` : formatarFaixa(im.quartos, d)
  const ficha: { icone: NomeIcone; rotulo: string; rotuloCurto?: string; valor: string; valorCurto?: string }[] = [
    { icone: 'area', rotulo: d.imovel.areaPrivativa, valor: formatarArea(im.area, idioma, d) },
    ...(im.tipo !== 'terreno'
      ? [
          { icone: 'cama' as const, rotulo: d.imovel.quartos, valor: quartos },
          { icone: 'banheira' as const, rotulo: d.imovel.banheiros, valor: formatarFaixa(im.banheiros, d) },
        ]
      : []),
    { icone: 'carro', rotulo: d.imovel.vagas, rotuloCurto: d.imovel.vagasCurto, valor: vagas },
    ...(im.entrega && !pronto
      ? [{ icone: 'calendario' as const, rotulo: d.imovel.entrega, valor: formatarEntrega(im.entrega, d), valorCurto: formatarEntregaCurta(im.entrega, d) }]
      : []),
  ]
  const etapaAtual = SITUACOES.indexOf(im.situacao)
  const textoObra = (() => {
    const base = im.situacao === 'em-construcao' ? d.imovel.obraAndamento : pronto ? d.imovel.obraConcluida : d.imovel.obraIniciar
    return im.entrega && !pronto ? preencher(d.imovel.entregaPrevista, { situacao: base, data: formatarEntregaCurta(im.entrega, d) }) : base
  })()
  const enderecoTexto = im.local.logradouro ?? `${im.local.bairro}, ${im.local.cidade} – ${im.local.uf}`
  const consultaMapa = `${im.nome}, ${im.local.logradouro ? `${im.local.logradouro}, ` : ''}${im.local.bairro}, ${im.local.cidade} - ${im.local.uf}`
  const imoveis = urlSecao(idioma, 'imoveis')
  const migalhas = [
    { nome: d.nav.inicio, href: urlInicio(idioma) },
    { nome: d.nav.imoveis, href: imoveis },
    { nome: im.local.cidade, href: `${imoveis}?cidade=${im.local.cidadeSlug}` },
    { nome: im.nome, href: urlImovelInternacional(idioma, im.slug) },
  ]

  return (
    <>
      <CabecalhoInternacional
        idioma={idioma}
        ativo="imoveis"
        variante="detalhe"
        versoes={versoes((i) => urlImovelInternacional(i, im.slug), urlImovel(im.slug))}
      />
      <main id="conteudo">
        <div className={`container ${s.topo}`}>
          <Migalhas itens={migalhas} rotulo={d.nav.voceEstaEm} className={s.migalhas} />
          <div className={s.galeriaMargem}>
            <Galeria fotos={fotosDoImovel(im)} textos={d.imovel.galeria} />
          </div>
        </div>

        <div className={`container ${s.layout}`}>
          <div className={s.cabecalhoImovel}>
            <div className={s.etiquetas}>
              <span className={`etiqueta etiqueta-${im.situacao}`}>{d.imovel.situacao[im.situacao]}</span>
              <span className="etiqueta etiqueta-contorno">
                {d.imovel.codigo} {im.codigo}
              </span>
            </div>
            <div className={s.tituloLinha}>
              <div className={s.tituloTexto}>
                <h1 translate="no">{im.nome}</h1>
                <p>
                  <Icone nome="local" tamanho={18} />
                  {im.chamada}
                </p>
              </div>
              <BotaoCompartilhar className={s.compartilhar} titulo={im.nome} textos={{ compartilhar: d.imovel.compartilhar, copiado: d.imovel.linkCopiado }} />
            </div>
          </div>

          <div className={s.lateral}>
            <section className={s.preco} aria-label={d.imovel.investimento}>
              <div>
                <span>{d.imovel.precoAPartirDe}</span>
                <strong>{formatarReais(im.preco, idioma, d)}</strong>
                {aproximado && cotacao && (
                  <>
                    <span className={si.aproximado}>{aproximado}</span>
                    <small>{preencher(d.imovel.aproximadoNota, { data: formatarDataCotacao(cotacao, idioma) })}</small>
                  </>
                )}
                <small>{d.imovel.precoNota}</small>
              </div>
              <div className={s.precoAcoes}>
                <a className="btn btn-sol btn-quadrado" href={linkWhatsApp(mensagemWhats)} target="_blank" rel="noopener" data-rastro="ficha-preco">
                  <Icone nome="whatsapp" tamanho={18} espessura={2} />
                  {d.imovel.falarWhatsApp}
                </a>
                <a className={`btn btn-quadrado ${s.botaoClaro}`} href="#simular-parcelas">
                  {d.imovel.simularParcelas}
                </a>
              </div>
            </section>

            <section className={s.contato} aria-label={d.imovel.agendarVisita}>
              <ContatoImovelInternacional
                idioma={idioma}
                imovelId={im.id}
                nomeImovel={im.nome}
                mensagemParcelas={preencher(d.imovel.mensagemParcelas, { nome: im.nome })}
                contato={d.contato}
                visita={d.visita}
              />
            </section>
          </div>

          <div className={s.conteudo}>
            <section aria-label={d.imovel.fichaTecnica}>
              <ul className={s.ficha}>
                {ficha.map((item) => (
                  <li key={item.rotulo}>
                    <Icone nome={item.icone} tamanho={24} />
                    <span>
                      <span>
                        <span className={s.rotuloLongo}>{item.rotulo}</span>
                        <span className={s.rotuloCurto}>{item.rotuloCurto ?? item.rotulo}</span>
                      </span>
                      <strong>
                        <span className={s.rotuloLongo}>{item.valor}</span>
                        <span className={s.rotuloCurto}>{item.valorCurto ?? item.valor}</span>
                      </strong>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="t-obra" className={s.secao}>
              <div className={s.secaoTitulo}>
                <h2 id="t-obra" className="titulo-bloco">
                  {d.imovel.andamento}
                </h2>
                <span>{textoObra}</span>
              </div>
              <ol className={s.etapas}>
                {SITUACOES.map((etapa, i) => (
                  <li
                    key={etapa}
                    data-estado={i < etapaAtual ? 'feita' : i === etapaAtual ? 'atual' : 'futura'}
                    aria-current={i === etapaAtual ? 'step' : undefined}
                  >
                    <span className={s.barraEtapa} />
                    <span className={s.rotuloEtapa}>
                      <span className={s.marcador} aria-hidden="true">
                        {i < etapaAtual && <Icone nome="check" tamanho={18} espessura={2.4} />}
                      </span>
                      {d.imovel.situacao[etapa]}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {im.descricao.length > 0 && (
              <section aria-labelledby="t-sobre" className={s.secao}>
                <h2 id="t-sobre" className="titulo-bloco">
                  {d.imovel.sobre}
                </h2>
                {im.descricaoOriginal ? (
                  // Sem tradução no site: o navegador traduz, quando tem tradutor embutido (DescricaoNavegador).
                  <DescricaoNavegador paragrafos={im.descricao} idioma={idioma} textos={{ aviso: d.imovel.textoOriginal, ...d.imovel.navegador }} />
                ) : (
                  <div className={s.texto}>
                    {im.descricao.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                )}
              </section>
            )}

            {im.plantas.length > 0 && (
              <section aria-labelledby="t-plantas" className={s.secao}>
                <h2 id="t-plantas" className="titulo-bloco">
                  {d.imovel.plantas}
                </h2>
                <Plantas plantas={im.plantas} textos={{ escolher: d.imovel.escolherPlanta, nota: d.imovel.plantasNota }} locale={DADOS_IDIOMA[idioma].locale} />
              </section>
            )}

            {im.lazer.length > 0 && (
              <section aria-labelledby="t-lazer" className={s.secao}>
                <h2 id="t-lazer" className="titulo-bloco">
                  {d.imovel.lazer}
                </h2>
                <Lazer itens={im.lazer} textos={{ menos: d.imovel.lazerMenos, verTodos: d.imovel.lazerVerTodos }} />
              </section>
            )}

            <section aria-labelledby="t-local" className={s.secao}>
              <h2 id="t-local" className="titulo-bloco">
                {d.imovel.localizacao}
              </h2>
              <div className={s.enderecoLinha}>
                <address translate="no">
                  <strong>{enderecoTexto}</strong>
                  {im.local.logradouro && (
                    <span>
                      {im.local.bairro}, {im.local.cidade} – {im.local.uf}
                    </span>
                  )}
                </address>
                <a
                  className={`btn btn-linha btn-quadrado btn-p ${s.abrirMapa}`}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultaMapa)}`}
                  target="_blank"
                  rel="noopener"
                >
                  {d.imovel.abrirMapa} <Icone nome="externo" tamanho={16} espessura={2} />
                </a>
              </div>
              <MapaEstatico consulta={consultaMapa} legenda={d.imovel.abrirMapa} rotulo={d.imovel.abrirMapaRotulo} className={s.mapa} />
              {im.proximidades.length > 0 && (
                <div className={s.proximidades}>
                  <span>{d.imovel.pertoDe}</span>
                  <ul>
                    {im.proximidades.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section aria-labelledby="t-ficha" className={s.secao}>
              <h2 id="t-ficha" className="titulo-bloco">
                {d.imovel.fichaTecnica}
              </h2>
              <dl className={s.fichaTecnica}>
                <div>
                  <dt>{d.imovel.tipoRotulo}</dt>
                  <dd>{d.imovel.tipo[im.tipo]}</dd>
                </div>
                <div>
                  <dt>{d.imovel.situacaoRotulo}</dt>
                  <dd>{d.imovel.situacao[im.situacao]}</dd>
                </div>
                {im.construtora.slug !== SLUG_CONSTRUTORA_PADRAO && (
                  <div>
                    <dt>{d.imovel.construtora}</dt>
                    <dd translate="no">{im.construtora.nome}</dd>
                  </div>
                )}
                {im.entrega && !pronto && (
                  <div>
                    <dt>{d.imovel.entrega}</dt>
                    <dd>{formatarEntrega(im.entrega, d)}</dd>
                  </div>
                )}
                <div>
                  <dt>{d.imovel.areaPrivativa}</dt>
                  <dd>{formatarArea(im.area, idioma, d)}</dd>
                </div>
                <div>
                  <dt>{d.imovel.codigo}</dt>
                  <dd>{im.codigo}</dd>
                </div>
                <div>
                  <dt>{d.imovel.investimento}</dt>
                  <dd>
                    {im.preco > 0 ? `${d.imovel.precoAPartirDe} ` : ''}
                    {formatarReais(im.preco, idioma, d)}
                  </dd>
                </div>
              </dl>
              <p style={{ marginTop: 20 }}>
                <a href={urlImovel(im.slug)} hrefLang="pt-BR" className="link-texto">
                  {d.imovel.verEmPortugues}
                </a>
              </p>
            </section>
          </div>
        </div>

        {semelhantes.length > 0 && (
          <section aria-labelledby="t-similares" className={s.semelhantes}>
            <div className="container">
              <div className={s.semelhantesTopo}>
                <h2 id="t-similares">{preencher(d.imovel.semelhantes, { cidade: im.local.cidade })}</h2>
                <Link href={`${imoveis}?cidade=${im.local.cidadeSlug}`} className="link-texto" style={{ fontSize: 16, gap: 8 }}>
                  {d.imovel.verMais}
                  <Icone nome="seta" tamanho={18} espessura={2} />
                </Link>
              </div>
              <div className={`${s.gradeSemelhantes} carrossel-mobile`}>
                {semelhantes.map((sim) => (
                  <CardInternacional key={sim.id} imovel={sim} idioma={idioma} cotacao={cotacao} lista={`semelhantes-${idioma}`} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <RodapeInternacional idioma={idioma} comBarraInferior />
      <BotaoWhatsApp mensagem={mensagemWhats} somenteDesktop rotulo={d.nav.faleConosco} rotuloAcessivel={d.nav.faleConoscoWhatsApp} />

      {/* Barra fixa do celular, como na ficha em português. */}
      <div className={s.barraInferior}>
        <a className="btn btn-linha btn-quadrado" href={linkWhatsApp(mensagemWhats)} target="_blank" rel="noopener" data-rastro="ficha-barra-celular">
          <Icone nome="whatsapp" tamanho={19} espessura={2} />
          WhatsApp
        </a>
        <a className="btn btn-sol btn-quadrado" href="#agendar-visita">
          <Icone nome="calendario" tamanho={19} espessura={2} />
          {d.imovel.agendarVisita}
        </a>
      </div>
      <JsonLd dados={schemaAnuncioInternacional(im, idioma)} />
    </>
  )
}
