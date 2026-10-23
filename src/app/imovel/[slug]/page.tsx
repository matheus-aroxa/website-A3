import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { ContatoImovel } from '@/components/imovel/ContatoImovel'
import { Galeria } from '@/components/imovel/Galeria'
import { Lazer } from '@/components/imovel/Lazer'
import { Plantas } from '@/components/imovel/Plantas'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { JsonLd } from '@/components/seo/JsonLd'
import { BotaoCompartilhar } from '@/components/ui/BotaoCompartilhar'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { Migalhas } from '@/components/ui/Migalhas'
import { fotosComCapaPrimeiro } from '@/lib/imoveis/busca'
import { caminhoDaRota, ROTA_VAZIA } from '@/lib/imoveis/filtros'
import {
  SITUACOES,
  etiquetaImovel,
  formatarArea,
  formatarEntrega,
  formatarEntregaCurta,
  formatarFaixa,
  formatarPreco,
  rotuloPreco,
  rotuloSituacao,
  rotuloTipo,
} from '@/lib/imoveis/formato'
import { listarIndice, listarSemelhantes, obterImovelPorSlug } from '@/lib/imoveis/repositorio'
import { categoriaDoImovel, migalhasDoImovel, urlImovel } from '@/lib/imoveis/rotas'
import type { Imovel } from '@/lib/imoveis/tipos'
import { schemaAnuncio } from '@/lib/seo'
import { linkWhatsApp } from '@/lib/site'
import s from '@/components/imovel/Imovel.module.css'

// Página 100% estática. Imóveis novos no CRM são gerados no primeiro acesso
// (o visitante recebe a página completa, nunca um esqueleto) e ficam em cache.
export const ensureStatic = 'navigation'

export async function generateStaticParams() {
  const imoveis = await listarIndice()
  return imoveis.map((im) => ({ slug: im.slug }))
}

// Ex.: "Apartamentos de 2 e 3 quartos com suíte em Jaguaribe, Paulista – PE. Investimento a partir de
// R$ 265.000, entrega prevista para janeiro de 2028. Agende sua visita."
function descricaoSeo(im: Imovel) {
  const preco = `${rotuloPreco(im.finalidade)} ${formatarPreco(im.preco, im.finalidade)}`
  const entrega =
    im.entrega && im.situacao !== 'pronto' ? `, entrega prevista para ${formatarEntrega(im.entrega).toLowerCase()}` : ''
  const chamada = im.finalidade === 'aluguel' ? 'Fale com um corretor.' : 'Agende sua visita.'
  return `${im.chamada}. ${preco}${entrega}. ${chamada}`
}

export async function generateMetadata({ params }: PageProps<'/imovel/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const im = await obterImovelPorSlug(slug)
  if (!im) return { title: 'Imóvel não encontrado', robots: { index: false } }
  const titulo = `${im.nome}, ${im.local.bairro} – ${im.local.cidade}/${im.local.uf}`
  const descricao = descricaoSeo(im)
  const url = urlImovel(im.slug)
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: titulo,
      description: descricao,
      url,
      images: fotosComCapaPrimeiro(im).slice(0, 4).map((f) => ({ url: f.src, width: f.width, height: f.height, alt: f.alt })),
    },
  }
}

const ETAPAS = SITUACOES

function textoObra(im: Imovel) {
  const base = im.situacao === 'em-construcao' ? 'Obras em andamento' : im.situacao === 'pronto' ? 'Obra concluída' : 'Obras a iniciar'
  return im.entrega ? `${base} · entrega prevista ${formatarEntregaCurta(im.entrega)}` : base
}

export default async function PaginaImovel({ params }: PageProps<'/imovel/[slug]'>) {
  const { slug } = await params
  const im = await obterImovelPorSlug(slug)
  if (!im) notFound()
  const semelhantes = await listarSemelhantes(im)

  const aluguel = im.finalidade === 'aluguel'
  const mensagemWhats = `Olá! Tenho interesse no ${im.nome} (cód. ${im.codigo}).`
  const quartos = im.suites ? `${formatarFaixa(im.quartos)}, com suíte` : formatarFaixa(im.quartos)
  const ficha: { icone: NomeIcone; rotulo: string; rotuloCurto?: string; valor: string; valorCurto?: string }[] = [
    { icone: 'area', rotulo: 'Área privativa', valor: formatarArea(im.area) },
    ...(im.tipo !== 'terreno'
      ? [
          { icone: 'cama' as const, rotulo: 'Quartos', valor: quartos },
          { icone: 'banheira' as const, rotulo: 'Banheiros', valor: formatarFaixa(im.banheiros) },
        ]
      : []),
    { icone: 'carro', rotulo: 'Vagas de garagem', rotuloCurto: 'Vagas', valor: im.vagas ? formatarFaixa(im.vagas) : 'A consultar' },
    ...(im.entrega && im.situacao !== 'pronto'
      ? [
          {
            icone: 'calendario' as const,
            rotulo: 'Entrega prevista',
            valor: formatarEntrega(im.entrega),
            valorCurto: formatarEntregaCurta(im.entrega).replace(/^./, (c) => c.toUpperCase()),
          },
        ]
      : []),
    ...(im.unidades ? [{ icone: 'predio' as const, rotulo: 'Unidades', valor: im.unidades }] : []),
  ]
  const etapaAtual = ETAPAS.indexOf(im.situacao)
  const enderecoTexto = im.local.logradouro ?? `${im.local.bairro}, ${im.local.cidade} – ${im.local.uf}`
  const consultaMapa = `${im.nome}, ${im.local.logradouro ? `${im.local.logradouro}, ` : ''}${im.local.bairro}, ${im.local.cidade} - ${im.local.uf}`
  const categoria = categoriaDoImovel(im)

  return (
    <>
      <Cabecalho ativo="imoveis" variante="detalhe" />
      <main id="conteudo">
        <div className={`container ${s.topo}`}>
          <Migalhas itens={migalhasDoImovel(im)} className={s.migalhas} />
          <div className={s.galeriaMargem}>
            <Galeria fotos={fotosComCapaPrimeiro(im)} />
          </div>
        </div>

        <div className={`container ${s.layout}`}>
          <div className={s.cabecalhoImovel}>
            <div className={s.etiquetas}>
              <span className={`etiqueta ${aluguel ? 'etiqueta-aluguel' : `etiqueta-${im.situacao}`}`}>{etiquetaImovel(im)}</span>
              {im.mcmv && <span className="etiqueta etiqueta-suave">Minha Casa Minha Vida</span>}
              <span className="etiqueta etiqueta-contorno">Cód. {im.codigo}</span>
            </div>
            <div className={s.tituloLinha}>
              <div className={s.tituloTexto}>
                <h1>{im.nome}</h1>
                <p>
                  <Icone nome="local" tamanho={18} />
                  {im.chamada}
                </p>
              </div>
              <BotaoCompartilhar className={s.compartilhar} titulo={im.nome} />
            </div>
          </div>

          <div className={s.lateral}>
            <section className={s.preco} aria-label="Valor">
              <div>
                <span>{rotuloPreco(im.finalidade)}</span>
                <strong>{formatarPreco(im.preco, im.finalidade)}</strong>
                <small>
                  {aluguel
                    ? 'Valor mensal, sem condomínio e IPTU. Consulte as condições com um corretor.'
                    : 'O valor pode mudar conforme a disponibilidade na tabela da construtora.'}
                </small>
              </div>
              <div className={s.precoAcoes}>
                <a className="btn btn-sol btn-quadrado" href={linkWhatsApp(mensagemWhats)} target="_blank" rel="noopener">
                  <Icone nome="whatsapp" tamanho={18} espessura={2} />
                  WhatsApp
                </a>
                <a className={`btn btn-quadrado ${s.botaoClaro}`} href={aluguel ? '#falar-com-corretor' : '#simular-parcelas'}>
                  {aluguel ? 'Tirar dúvidas' : 'Simular parcelas'}
                </a>
              </div>
            </section>

            <section className={s.contato} aria-label="Contato sobre este imóvel">
              <ContatoImovel imovelId={im.id} nomeImovel={im.nome} />
            </section>
          </div>

          <div className={s.conteudo}>
            <section aria-label="Resumo do imóvel">
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

            {!aluguel && (
              <section aria-labelledby="t-obra" className={s.secao}>
                <div className={s.secaoTitulo}>
                  <h2 id="t-obra" className="titulo-bloco">
                    Andamento da obra
                  </h2>
                  <span>{textoObra(im)}</span>
                </div>
                <ol className={s.etapas}>
                  {ETAPAS.map((etapa, i) => (
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
                        {rotuloSituacao[etapa]}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section aria-labelledby="t-sobre" className={s.secao}>
              <h2 id="t-sobre" className="titulo-bloco">
                Sobre {aluguel ? 'o imóvel' : 'o empreendimento'}
              </h2>
              <div className={s.texto}>
                {im.descricao.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>

            {im.plantas.length > 0 && (
              <section aria-labelledby="t-plantas" className={s.secao}>
                <h2 id="t-plantas" className="titulo-bloco">
                  Plantas disponíveis
                </h2>
                <Plantas plantas={im.plantas} />
              </section>
            )}

            {im.lazer.length > 0 && (
              <section aria-labelledby="t-lazer" className={s.secao}>
                <h2 id="t-lazer" className="titulo-bloco">
                  Lazer e infraestrutura
                </h2>
                <Lazer itens={im.lazer} />
              </section>
            )}

            <section aria-labelledby="t-local" className={s.secao}>
              <h2 id="t-local" className="titulo-bloco">
                Localização
              </h2>
              <div className={s.enderecoLinha}>
                <address>
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
                  Abrir no Google Maps <Icone nome="externo" tamanho={16} espessura={2} />
                </a>
              </div>
              <MapaEstatico consulta={consultaMapa} legenda="Ver no Google Maps" className={s.mapa} />
              {im.proximidades.length > 0 && (
                <div className={s.proximidades}>
                  <span>Perto de</span>
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
                Ficha técnica
              </h2>
              <dl className={s.fichaTecnica}>
                <div>
                  <dt>Tipo</dt>
                  <dd>{rotuloTipo[im.tipo]}</dd>
                </div>
                <div>
                  <dt>{aluguel ? 'Finalidade' : 'Situação'}</dt>
                  <dd>{aluguel ? 'Aluguel' : rotuloSituacao[im.situacao]}</dd>
                </div>
                {im.construtora && (
                  <div>
                    <dt>Construtora</dt>
                    <dd>{im.construtora}</dd>
                  </div>
                )}
                {im.entrega && im.situacao !== 'pronto' && (
                  <div>
                    <dt>Previsão de entrega</dt>
                    <dd>{formatarEntrega(im.entrega)}</dd>
                  </div>
                )}
                <div>
                  <dt>Área privativa</dt>
                  <dd>{formatarArea(im.area)}</dd>
                </div>
                {im.mcmv && (
                  <div>
                    <dt>Minha Casa Minha Vida</dt>
                    <dd>Elegível</dd>
                  </div>
                )}
                <div>
                  <dt>Código</dt>
                  <dd>{im.codigo}</dd>
                </div>
                <div>
                  <dt>{aluguel ? 'Aluguel' : 'Investimento'}</dt>
                  <dd>
                    {aluguel ? '' : 'A partir de '}
                    {formatarPreco(im.preco, im.finalidade)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        {semelhantes.length > 0 && (
          <section aria-labelledby="t-similares" className={s.semelhantes}>
            <div className="container">
              <div className={s.semelhantesTopo}>
                <h2 id="t-similares">
                  {aluguel ? 'Outros imóveis para alugar' : 'Empreendimentos parecidos'} em {im.local.cidade}
                </h2>
                <Link
                  href={caminhoDaRota({ ...ROTA_VAZIA, categoria, cidade: im.local.cidadeSlug })}
                  className="link-texto"
                  style={{ fontSize: 16, gap: 8 }}
                >
                  Ver mais {categoria === 'lancamentos' ? 'lançamentos' : 'imóveis'}
                  <Icone nome="seta" tamanho={18} espessura={2} />
                </Link>
              </div>
              <div className={`${s.gradeSemelhantes} carrossel-mobile`}>
                {semelhantes.map((sim) => (
                  <CardImovel key={sim.id} imovel={sim} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Rodape comBarraInferior />
      <BotaoWhatsApp mensagem={mensagemWhats} somenteDesktop />

      {/* Barra fixa do celular (protótipo mobile). */}
      <div className={s.barraInferior}>
        <a className="btn btn-linha btn-quadrado" href={linkWhatsApp(mensagemWhats)} target="_blank" rel="noopener">
          <Icone nome="whatsapp" tamanho={19} espessura={2} />
          WhatsApp
        </a>
        <a className="btn btn-sol btn-quadrado" href="#agendar-visita">
          <Icone nome="calendario" tamanho={19} espessura={2} />
          Agendar visita
        </a>
      </div>
      <JsonLd dados={schemaAnuncio(im)} />
    </>
  )
}
