import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { JsonLd } from '@/components/seo/JsonLd'
import { Icone } from '@/components/ui/Icone'
import { Migalhas } from '@/components/ui/Migalhas'
import { CAMINHO_MCMV, caminhoMcmv, cidadesComMcmv, textosMcmv } from '@/lib/imoveis/mcmv'
import { resumirImoveis } from '@/lib/imoveis/paginas'
import { MCMV_POR_PAGINA, listarCidades, listarIndice, listarMcmv } from '@/lib/imoveis/repositorio'
import { schemaColecao, schemaListaImoveis } from '@/lib/seo'
import { imagemCompartilhamento, linkWhatsApp, mensagensWhatsApp, openGraphBase } from '@/lib/site'
import b from '@/components/busca/Busca.module.css'
import t from '@/components/layout/PaginaTexto.module.css'
import s from './Mcmv.module.css'

/** Imóveis do programa (de uma cidade ou de todas) e as cidades que têm página própria. `null`: a página não existe. */
async function carregar(cidadeSlug: string | null) {
  const [indice, cidades] = await Promise.all([listarIndice(), listarCidades()])
  const comPagina = cidadesComMcmv(indice, cidades)
  // Cidade com poucos imóveis do programa não ganha página: ficaria sem conteúdo próprio.
  if (cidadeSlug && !comPagina.some((c) => c.slug === cidadeSlug)) return null
  const cidade = cidades.find((c) => c.slug === cidadeSlug) ?? null
  const doPrograma = indice.filter((im) => im.mcmv && (!cidade || im.local.cidadeSlug === cidade.slug))
  if (!doPrograma.length) return null
  return { cidade, comPagina, resumo: resumirImoveis(doPrograma) }
}

export async function metadadosMcmv(cidadeSlug: string | null): Promise<Metadata> {
  const dados = await carregar(cidadeSlug)
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } }
  const { titulo, descricao } = textosMcmv(dados.cidade, dados.resumo)
  const canonical = caminhoMcmv(cidadeSlug)
  return {
    title: dados.cidade ? titulo : { absolute: titulo },
    description: descricao,
    alternates: { canonical },
    openGraph: { ...openGraphBase, title: titulo, description: descricao, url: canonical, images: [imagemCompartilhamento] },
  }
}

export async function PaginaMcmv({ cidadeSlug }: { cidadeSlug: string | null }) {
  const dados = await carregar(cidadeSlug)
  if (!dados) notFound()
  const { cidade, comPagina, resumo } = dados
  const { itens } = await listarMcmv(cidadeSlug)
  const { h1, abertura, descricao } = textosMcmv(cidade, resumo)
  const caminho = caminhoMcmv(cidadeSlug)
  const outras = comPagina.filter((c) => c.slug !== cidadeSlug)
  const verTodos = `/imoveis/venda${cidade ? `/${cidade.slug}` : ''}?mcmv=1`

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <main id="conteudo">
        <section className={b.topo}>
          <div className={`container ${b.titulos}`}>
            <Migalhas
              itens={[
                { nome: 'Início', href: '/' },
                { nome: 'Minha Casa Minha Vida', href: CAMINHO_MCMV },
                ...(cidade ? [{ nome: cidade.nome, href: caminho }] : []),
              ]}
            />
            <h1>{h1}</h1>
            <p>{abertura}</p>
          </div>
        </section>

        <section className={s.lista} aria-label="Imóveis do programa">
          <div className="container">
            <div className={b.grade}>
              {itens.map((im, i) => (
                <CardImovel key={im.id} imovel={im} nivelTitulo={2} prioritario={i < 2} />
              ))}
            </div>
            {resumo.total > MCMV_POR_PAGINA && (
              <div className={s.mais}>
                <Link href={verTodos} className="btn btn-mar btn-g">
                  Ver os {resumo.total} imóveis do programa <Icone nome="seta" tamanho={18} espessura={2} />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className={s.explicacao} aria-labelledby="t-como-funciona">
          <div className="container">
            <div className={t.conteudo}>
              <h2 id="t-como-funciona">Como funciona o Minha Casa Minha Vida</h2>
              <p>
                O Minha Casa Minha Vida é o programa habitacional do Governo Federal que facilita a compra da casa própria,
                com condições especiais de financiamento para famílias dentro de determinadas faixas de renda.
              </p>
              <p>
                Quem pode participar, os limites de renda e de valor do imóvel e as condições do financiamento dependem das
                regras do programa e do banco que concede o crédito, e elas mudam de tempos em tempos. Por isso, o caminho
                mais seguro é conferir a sua situação com um corretor antes de escolher o imóvel.
              </p>
              <p>
                Os corretores da A3 simulam as parcelas, orientam sobre a documentação e acompanham você da visita à
                assinatura do contrato.
              </p>
              <div className={t.acoes}>
                <a href={linkWhatsApp(mensagensWhatsApp.mcmv)} target="_blank" rel="noopener" className="btn btn-sol btn-g">
                  <Icone nome="whatsapp" tamanho={20} espessura={2} />
                  Saber se eu me enquadro
                </a>
                <Link href={cidade ? `/imoveis/venda/${cidade.slug}` : '/imoveis/venda'} className="btn btn-contorno btn-g">
                  Ver todos os imóveis à venda{cidade ? ` em ${cidade.nome}` : ''}
                </Link>
              </div>
            </div>

            {outras.length > 0 && (
              <div className={s.outras}>
                <nav aria-label="Minha Casa Minha Vida em outras cidades">
                  <h3>Minha Casa Minha Vida em outras cidades</h3>
                  <ul>
                    {outras.map((c) => (
                      <li key={c.slug}>
                        <Link href={c.href}>Minha Casa Minha Vida em {c.nome}</Link> <span>({c.total})</span>
                      </li>
                    ))}
                    {cidade && (
                      <li>
                        <Link href={CAMINHO_MCMV}>Minha Casa Minha Vida em Paulista, Recife e região</Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </section>
      </main>
      <JsonLd dados={schemaColecao({ nome: h1, descricao, caminho })} />
      <JsonLd dados={schemaListaImoveis(itens, 1)} />
      <Rodape />
      <BotaoWhatsApp mensagem={mensagensWhatsApp.mcmv} />
    </>
  )
}
