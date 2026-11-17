import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import s from '@/app/(site)/page.module.css'
import { BuscaInicialInternacional } from '@/components/internacional/BuscaInicialInternacional'
import { CabecalhoInternacional } from '@/components/internacional/CabecalhoInternacional'
import { CardInternacional } from '@/components/internacional/CardInternacional'
import { FormularioInternacional } from '@/components/internacional/FormularioInternacional'
import { RodapeInternacional } from '@/components/internacional/RodapeInternacional'
import { CarrosselDestaques } from '@/components/imoveis/CarrosselDestaques'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { RevelarAoRolar } from '@/components/ui/RevelarAoRolar'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'
import { slugificar } from '@/lib/imoveis/formato'
import { DESTAQUES_POR_VEZ, LIMITE_DESTAQUES } from '@/lib/imoveis/repositorio'
import { listarDestaquesInternacionais, listarImoveisInternacionais } from '@/lib/internacional/catalogo'
import { obterCotacoes } from '@/lib/internacional/cotacao'
import { opcoesPrecoMaximo, precoNoIdioma } from '@/lib/internacional/formato'
import { DADOS_IDIOMA, alternativas, ehRevisado, idiomaDisponivel, urlImovelInternacional, urlInicio, urlSecao, versoes } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { imagemCompartilhamento, imagensSite, linkWhatsApp, site } from '@/lib/site'

// A home da área internacional tem o mesmo desenho da home em português (app/(site)/page.tsx, mesmo CSS): topo com o
// imóvel em destaque e o painel de busca, destaques, serviços, faixa de chamada, quem somos, depoimentos e contato.
// Muda o conteúdo: os serviços falam de comprar de fora, a faixa leva ao guia de compra e não há "Anunciar".

export const ensureStatic = 'navigation'

export async function generateMetadata({ params }: PageProps<'/[idioma]'>): Promise<Metadata> {
  const { idioma } = await params
  if (!idiomaDisponivel(idioma)) return {}
  const d = await dicionario(idioma)
  return {
    title: { absolute: d.inicio.tituloSeo },
    description: d.inicio.descricaoSeo,
    alternates: { canonical: urlInicio(idioma), ...(ehRevisado(idioma) && { languages: alternativas(urlInicio) }) },
    openGraph: {
      type: 'website',
      locale: DADOS_IDIOMA[idioma].ogLocale,
      siteName: site.nome,
      url: urlInicio(idioma),
      title: d.inicio.tituloSeo,
      description: d.inicio.descricaoSeo,
      images: [imagemCompartilhamento],
    },
  }
}

const ICONES_SERVICOS: NomeIcone[] = ['casa', 'check', 'chave', 'local']
const ICONES_DEPOIMENTOS: NomeIcone[] = ['casa', 'check', 'coracao']
const NOMES_DEPOIMENTOS = ['Rayani', 'Gilberto', 'Estela']

export default async function InicioInternacional({ params }: PageProps<'/[idioma]'>) {
  const { idioma } = await params
  if (!idiomaDisponivel(idioma)) notFound()
  const d = await dicionario(idioma)
  const [destaques, todos, cotacoes] = await Promise.all([listarDestaquesInternacionais(LIMITE_DESTAQUES), listarImoveisInternacionais(), obterCotacoes()])
  const cotacao = cotacoes[DADOS_IDIOMA[idioma].moeda]
  const heroi = destaques[0]
  const precoHeroi = heroi && precoNoIdioma(heroi.preco, idioma, cotacao, d)
  const imoveis = urlSecao(idioma, 'imoveis')
  const contatoWhats = linkWhatsApp(d.contato.mensagemPadrao)
  // Cidades e bairros dos imóveis da área internacional, para o painel de busca do topo (como o da home em português).
  const porCidade = new Map<string, { slug: string; nome: string; bairros: Map<string, string> }>()
  for (const im of todos) {
    const c = porCidade.get(im.cidadeSlug) ?? { slug: im.cidadeSlug, nome: im.local.cidade, bairros: new Map() }
    c.bairros.set(slugificar(im.local.bairro), im.local.bairro)
    porCidade.set(im.cidadeSlug, c)
  }
  const cidades = [...porCidade.values()]
    .map((c) => ({ slug: c.slug, nome: c.nome, bairros: [...c.bairros].map(([slug, nome]) => ({ slug, nome })).sort((a, b) => a.nome.localeCompare(b.nome)) }))
    .sort((a, b) => a.nome.localeCompare(b.nome))
  const linksServicos = [imoveis, urlSecao(idioma, 'guia'), '#contato', urlSecao(idioma, 'regiao')]
  const [antesNome, depoisNome] = d.inicio.subtitulo.split('{nome}')

  return (
    <>
      <CabecalhoInternacional idioma={idioma} versoes={versoes(urlInicio)} />
      <main id="conteudo">
        {/* Topo */}
        <section className={s.hero}>
          <div className={`container ${s.heroConteudo}`}>
            <div className={s.heroEsquerda}>
              <div className={s.heroTexto} data-revelar="esquerda">
                <h1 className={s.heroTitulo}>
                  {d.inicio.titulo} <span>{d.inicio.tituloDestaque}</span>
                </h1>
                <p>
                  {antesNome}
                  <strong>{site.nome}</strong>
                  {depoisNome}
                </p>
              </div>
              {heroi && (
                <div className={s.heroMidia} data-revelar="esquerda">
                  <div className={s.heroFoto}>
                    <Image
                      loader={carregadorImagem}
                      src={heroi.capa.src}
                      alt={d.imovel.altFoto({ nome: heroi.nome, tipo: heroi.tipo, bairro: heroi.local.bairro, cidade: heroi.local.cidade, posicao: 0 })}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1360px) 56vw, 780px"
                      placeholder={heroi.capa.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={heroi.capa.blurDataURL}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <Link href={urlImovelInternacional(idioma, heroi.slug)} className={`elevar ${s.heroCard}`}>
                    <Image loader={carregadorImagem} src={heroi.capa.src} alt="" width={64} height={64} sizes="64px" />
                    <span className={s.heroCardTexto}>
                      <span className={s.heroCardRotulo}>
                        {d.imovel.situacao[heroi.situacao]} · {heroi.local.bairro}
                      </span>
                      <strong translate="no">{heroi.nome}</strong>
                      <span>
                        {d.imovel.precoAPartirDe} <b>{precoHeroi}</b>
                      </span>
                    </span>
                    <Icone nome="chevron-direita" espessura={2} className={s.heroCardSeta} />
                  </Link>
                </div>
              )}
            </div>
            <div className={s.heroBusca} data-revelar="direita">
              <BuscaInicialInternacional
                destino={imoveis}
                cidades={cidades}
                precos={opcoesPrecoMaximo(idioma, cotacao, d)}
                textos={{
                  ...d.inicio.busca,
                  bairro: d.imoveis.bairro,
                  precoMax: d.imoveis.precoMax,
                  qualquerPreco: d.imoveis.qualquerPreco,
                  quartos: d.imoveis.quartos,
                  banheiros: d.imoveis.banheiros,
                  // Forma curta, como o "Vagas" da home em português ("Places de parking" quebrava a linha).
                  vagas: d.imovel.vagasCurto,
                  tipos: d.imovel.tipoPlural,
                }}
              />
            </div>
          </div>
        </section>

        {/* Destaques */}
        {destaques.length > 0 && (
          <section aria-labelledby="t-destaques" className={s.destaques}>
            <div className={`container ${s.pilha}`}>
              <div className={s.cabecalhoSecao} data-revelar>
                <div className={s.tituloGrupo}>
                  <span className="sobretitulo">{d.inicio.destaquesSobretitulo}</span>
                  <h2 id="t-destaques" className="titulo-secao">
                    {d.inicio.destaquesTitulo}
                  </h2>
                </div>
                <Link href={imoveis} className={`btn btn-sol btn-g ${s.verTodos}`}>
                  {d.inicio.verTodos} <Icone nome="seta" tamanho={18} espessura={2} />
                </Link>
              </div>
              <CarrosselDestaques porVez={DESTAQUES_POR_VEZ} classeGrade={s.gradeDestaques}>
                {destaques.map((im) => (
                  <CardInternacional key={im.id} imovel={im} idioma={idioma} cotacao={cotacao} variante="destaque" lista={`home-${idioma}`} />
                ))}
              </CarrosselDestaques>
              <Link href={imoveis} className={`btn btn-sol btn-g btn-bloco ${s.verTodosMobile}`}>
                {d.inicio.verTodos} <Icone nome="seta" tamanho={18} espessura={2} />
              </Link>
            </div>
          </section>
        )}

        {/* Serviços */}
        <section id="servicos" aria-labelledby="t-servicos" className={s.servicos}>
          <div className={`container ${s.servicosGrade}`}>
            <div className={s.servicosIntro} data-revelar="esquerda">
              <span className="sobretitulo">{d.inicio.servicosSobretitulo}</span>
              <h2 id="t-servicos" className="titulo-secao">
                {d.inicio.servicosTitulo} <span>{d.inicio.servicosTituloDestaque}</span>
              </h2>
              <p>{d.inicio.servicosTexto}</p>
            </div>
            <div className={s.servicosLista} data-revelar-filhos>
              {d.inicio.servicos.map((sv, i) => (
                <div key={sv.titulo} className={`elevar ${s.servico}`}>
                  <span className={s.servicoIcone}>
                    <Icone nome={ICONES_SERVICOS[i] ?? 'casa'} tamanho={26} />
                  </span>
                  <h3>{sv.titulo}</h3>
                  <p>{sv.texto}</p>
                  <Link href={linksServicos[i] ?? imoveis} className={s.servicoLink}>
                    {sv.link} <Icone nome="seta" tamanho={16} espessura={2} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada (no lugar do "Anunciar" do site em português) */}
        <section aria-labelledby="t-chamada" className={s.anunciar}>
          <div className="container">
            <div className={s.anunciarCaixa} data-revelar="zoom">
              <div className={s.anunciarTexto}>
                <h2 id="t-chamada">{d.inicio.chamadaTitulo}</h2>
                <p>{d.inicio.chamadaTexto}</p>
              </div>
              <div className={s.anunciarAcoes}>
                <Link href={urlSecao(idioma, 'guia')} className="btn btn-tinta btn-g">
                  {d.inicio.chamadaGuia} <Icone nome="seta" tamanho={18} espessura={2} />
                </Link>
                <a href={contatoWhats} target="_blank" rel="noopener" className="btn btn-contorno btn-g" data-rastro="home-chamada">
                  {d.inicio.chamadaCorretor}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quem somos */}
        <section id="quem-somos" aria-labelledby="t-quem" className={s.quem}>
          <div className={`container ${s.quemGrade}`}>
            <div className={s.quemFoto} data-revelar="esquerda">
              <Image {...imagensSite.equipe} alt={d.inicio.fotoEquipe} sizes="(max-width: 767px) 100vw, 45vw" placeholder="blur" />
            </div>
            <div className={s.quemTexto} data-revelar="direita">
              <span className="sobretitulo">{d.inicio.sobreSobretitulo}</span>
              <h2 id="t-quem" className="titulo-secao">
                {d.inicio.sobreTitulo}
              </h2>
              {d.inicio.sobreTexto.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <ul className={s.diferenciais}>
                {d.inicio.diferenciais.map((item) => (
                  <li key={item}>
                    <span>
                      <Icone nome="check" tamanho={16} espessura={2.4} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section aria-labelledby="t-depo" className={s.depoimentos}>
          <span aria-hidden="true" className={s.aspas}>
            ”
          </span>
          <div className={`container ${s.pilha}`}>
            <div className={s.depoIntro} data-revelar>
              <span className="sobretitulo">
                <Icone nome="coracao" tamanho={16} preenchido /> {d.inicio.depoSobretitulo}
              </span>
              <h2 id="t-depo" className="titulo-secao">
                {d.inicio.depoTitulo} <span>{d.inicio.depoTituloDestaque}</span>
              </h2>
              <p>{d.inicio.depoTexto}</p>
            </div>
            <div className={`${s.depoGrade} carrossel-mobile`} data-revelar-filhos>
              {d.inicio.depoimentos.map((dep, i) => {
                const icone = ICONES_DEPOIMENTOS[i] ?? 'check'
                const nome = NOMES_DEPOIMENTOS[i] ?? ''
                return (
                  <figure key={nome} className={s.depoimento}>
                    <span className={s.selo}>
                      <Icone nome={icone} tamanho={14} espessura={2} preenchido={icone === 'coracao'} />
                      {dep.selo}
                    </span>
                    <blockquote>“{dep.texto}”</blockquote>
                    <figcaption>
                      <span aria-hidden="true">{nome[0]}</span>
                      <span>
                        <strong>{nome}</strong>
                        <span>{dep.ocupacao}</span>
                      </span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="contato" aria-labelledby="t-contato" className={s.contato}>
          <div className={`container ${s.contatoGrade}`}>
            <div className={s.contatoInfo} data-revelar="esquerda">
              <span className="sobretitulo">{d.inicio.contatoSobretitulo}</span>
              <h2 id="t-contato" className="titulo-secao">
                {d.inicio.contatoTitulo}
              </h2>
              <p className={s.contatoLead}>{d.inicio.contatoTexto}</p>
              <ul className={s.canais}>
                <li>
                  <a href={contatoWhats} target="_blank" rel="noopener" data-rastro="home-contato">
                    <span className={s.canalIcone}>
                      <Icone nome="whatsapp" tamanho={22} />
                    </span>
                    <span>
                      <span>{d.inicio.canalWhatsApp}</span>
                      <strong>{site.telefone}</strong>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} data-rastro="home-contato">
                    <span className={s.canalIcone}>
                      <Icone nome="email" tamanho={22} />
                    </span>
                    <span>
                      <span>{d.inicio.canalEmail}</span>
                      <strong className={s.quebra}>{site.email}</strong>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={site.instagram} target="_blank" rel="noopener">
                    <span className={s.canalIcone}>
                      <Icone nome="instagram-logo" tamanho={22} />
                    </span>
                    <span>
                      <span>Instagram</span>
                      <strong>{site.instagramUsuario}</strong>
                    </span>
                  </a>
                </li>
                <li>
                  <div>
                    <span className={s.canalIcone}>
                      <Icone nome="local" tamanho={22} />
                    </span>
                    <span>
                      <span>{d.inicio.canalEscritorio}</span>
                      <strong>
                        {site.endereco.exibicao} · {d.rodape.pais}
                      </strong>
                    </span>
                  </div>
                </li>
              </ul>
              <p className={s.contatoLead} style={{ fontSize: 15 }}>
                {d.inicio.fuso}
              </p>
              <MapaEstatico
                consulta={`${site.nome}, ${site.endereco.logradouro}, ${site.endereco.bairro}, ${site.endereco.cidade} - ${site.endereco.uf}`}
                legenda={d.inicio.mapaLegenda}
                rotulo={d.imovel.abrirMapaRotulo}
              />
            </div>
            <div className={s.contatoForm} data-revelar="direita">
              <FormularioInternacional idioma={idioma} textos={d.contato} />
            </div>
          </div>
        </section>
      </main>
      <RodapeInternacional idioma={idioma} />
      <BotaoWhatsApp mensagem={d.contato.mensagemPadrao} rotulo={d.nav.faleConosco} rotuloAcessivel={d.nav.faleConoscoWhatsApp} />
      <RevelarAoRolar />
    </>
  )
}
