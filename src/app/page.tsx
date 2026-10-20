import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import equipe from '@/assets/site/equipe-a3-solucoes-imobiliarias.jpg'
import { BuscaInicial } from '@/components/home/BuscaInicial'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { FormularioContato } from '@/components/formularios/FormularioContato'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { RevelarAoRolar } from '@/components/ui/RevelarAoRolar'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { formatarPreco, rotuloPreco } from '@/lib/imoveis/formato'
import { listarCidades, listarDestaques, obterImovelHeroi } from '@/lib/imoveis/repositorio'
import { urlImovel } from '@/lib/imoveis/rotas'
import { linkWhatsApp, mensagensWhatsApp, site } from '@/lib/site'
import s from './page.module.css'

// A home inteira é gerada estaticamente (e regenerada quando o catálogo muda).
export const ensureStatic = 'navigation'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

const SERVICOS: { icone: NomeIcone; titulo: string; texto: string; link: string; href: string }[] = [
  {
    icone: 'casa',
    titulo: 'Comprar seu imóvel',
    texto: 'Apartamentos, casas de condomínio e terrenos à venda, com visita acompanhada por um corretor.',
    link: 'Imóveis à venda',
    href: '/imoveis/venda',
  },
  {
    icone: 'chave',
    titulo: 'Alugar sem complicação',
    texto: 'Encontramos o imóvel para alugar no bairro que você precisa e cuidamos da negociação com o proprietário.',
    link: 'Imóveis para alugar',
    href: '/imoveis/aluguel',
  },
  {
    icone: 'predio',
    titulo: 'Lançamentos e Minha Casa Minha Vida',
    texto: 'Imóveis na planta das construtoras parceiras, com orientação sobre o enquadramento no programa.',
    link: 'Ver lançamentos',
    href: '/imoveis/lancamentos',
  },
  {
    icone: 'porcentagem',
    titulo: 'Financiamento orientado',
    texto: 'Simulamos as parcelas e ajudamos você a escolher o tipo de financiamento que cabe na sua renda.',
    link: 'Simular financiamento',
    href: linkWhatsApp(mensagensWhatsApp.financiamento),
  },
]

const DEPOIMENTOS: { selo: string; icone: NomeIcone; texto: string; nome: string; ocupacao: string }[] = [
  {
    selo: 'Primeiro apartamento',
    icone: 'casa',
    texto: 'Muito grata pelo atendimento! Consegui realizar o sonho do meu primeiro apartamento.',
    nome: 'Rayani',
    ocupacao: 'Profissional de software',
  },
  {
    selo: 'Dúvidas esclarecidas',
    icone: 'check',
    texto: 'Ótimo atendimento! A corretora esclareceu todas as minhas dúvidas…',
    nome: 'Gilberto',
    ocupacao: 'Professor',
  },
  {
    selo: 'Bem atendida',
    icone: 'coracao',
    texto: 'Fui muito bem atendida pelos corretores da Imobiliária A3.',
    nome: 'Estela',
    ocupacao: 'Atendente',
  },
]

const DIFERENCIAIS = [
  'Atendimento próximo, pelo WhatsApp ou no escritório',
  'Orientação sobre financiamento e documentação',
  'Catálogo com mais de 300 imóveis',
]

export default async function Home() {
  const [heroi, destaques, cidades] = await Promise.all([obterImovelHeroi(), listarDestaques(), listarCidades()])
  const fotoHeroi = heroi?.fotos[0]

  return (
    <>
      <Cabecalho />
      <main id="conteudo">
        {/* Hero */}
        <section className={s.hero}>
          {fotoHeroi && (
            <div className={s.heroFundo}>
              <Image
                src={fotoHeroi.src}
                alt={fotoHeroi.alt}
                fill
                sizes="100vw"
                placeholder={fotoHeroi.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={fotoHeroi.blurDataURL}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          )}
          <div className={`container ${s.heroConteudo}`}>
            <div className={s.heroTexto}>
              <h1 className={s.heroTitulo}>
                Seu lar <span>está aqui.</span>
              </h1>
              <p>
                Na <strong>{site.nome}</strong> você encontra apartamentos, casas de condomínio e lançamentos para
                comprar ou alugar — com um corretor do primeiro contato à entrega das chaves.
              </p>
              {heroi && (
                <Link href={urlImovel(heroi.slug)} className={s.heroLink}>
                  Em destaque: <strong>{heroi.nome}</strong> · {heroi.local.bairro}
                  <span>
                    {' '}
                    {rotuloPreco(heroi.finalidade).toLowerCase()} {formatarPreco(heroi.preco, heroi.finalidade)}
                  </span>
                  <Icone nome="chevron-direita" tamanho={16} espessura={2.4} />
                </Link>
              )}
            </div>
            <div className={s.heroBusca}>
              <BuscaInicial cidades={cidades} />
            </div>
          </div>
          {fotoHeroi && <span className={s.ilustrativa}>Imagem ilustrativa</span>}
        </section>

        {/* Destaques */}
        <section aria-labelledby="t-destaques" className={s.destaques}>
          <div className={`container ${s.pilha}`}>
            <div className={s.cabecalhoSecao} data-revelar>
              <div className={s.tituloGrupo}>
                <span className="sobretitulo">Destaques</span>
                <h2 id="t-destaques" className="titulo-secao">
                  Lançamentos e empreendimentos em destaque
                </h2>
              </div>
              <Link href="/imoveis" className={`btn btn-sol btn-g ${s.verTodos}`}>
                Ver todos os imóveis <Icone nome="seta" tamanho={18} espessura={2} />
              </Link>
            </div>
            <div className={`${s.gradeDestaques} carrossel-mobile`} data-revelar-filhos>
              {destaques.map((im) => (
                <CardImovel key={im.id} imovel={im} variante="destaque" />
              ))}
            </div>
            <Link href="/imoveis" className={`btn btn-sol btn-g btn-bloco ${s.verTodosMobile}`}>
              Ver todos os imóveis <Icone nome="seta" tamanho={18} espessura={2} />
            </Link>
          </div>
        </section>

        {/* Serviços */}
        <section id="servicos" aria-labelledby="t-servicos" className={s.servicos}>
          <div className={`container ${s.servicosGrade}`}>
            <div className={s.servicosIntro} data-revelar="esquerda">
              <span className="sobretitulo">Nossos serviços</span>
              <h2 id="t-servicos" className="titulo-secao">
                Da primeira visita à <span>entrega das chaves</span>
              </h2>
              <p>
                Um corretor da A3 acompanha cada etapa: a escolha do imóvel, a visita, a simulação do financiamento e a
                assinatura do contrato.
              </p>
            </div>
            <div className={s.servicosLista} data-revelar-filhos>
              {SERVICOS.map((sv) => (
                <div key={sv.titulo} className={`elevar ${s.servico}`}>
                  <span className={s.servicoIcone}>
                    <Icone nome={sv.icone} tamanho={26} />
                  </span>
                  <h3>{sv.titulo}</h3>
                  <p>{sv.texto}</p>
                  {sv.href.startsWith('http') ? (
                    <a href={sv.href} target="_blank" rel="noopener" className={s.servicoLink}>
                      {sv.link} <Icone nome="seta" tamanho={16} espessura={2} />
                    </a>
                  ) : (
                    <Link href={sv.href} className={s.servicoLink}>
                      {sv.link} <Icone nome="seta" tamanho={16} espessura={2} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Anunciar */}
        <section id="anunciar" aria-labelledby="t-anunciar" className={s.anunciar}>
          <div className="container">
            <div className={s.anunciarCaixa} data-revelar="zoom">
              <div className={s.anunciarTexto}>
                <h2 id="t-anunciar">Tem um imóvel para vender ou alugar?</h2>
                <p>Cadastre seu imóvel e a A3 cuida da divulgação e do atendimento aos interessados.</p>
              </div>
              <div className={s.anunciarAcoes}>
                <a href={linkWhatsApp(mensagensWhatsApp.anunciar)} target="_blank" rel="noopener" className="btn btn-tinta btn-g">
                  Anunciar meu imóvel <Icone nome="seta" tamanho={18} espessura={2} />
                </a>
                <a
                  href={linkWhatsApp(mensagensWhatsApp.anunciar)}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-contorno btn-g"
                >
                  Falar com um corretor
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quem somos */}
        <section id="quem-somos" aria-labelledby="t-quem" className={s.quem}>
          <div className={`container ${s.quemGrade}`}>
            <div className={s.quemFoto} data-revelar="esquerda">
              <Image
                src={equipe}
                alt="Equipe da A3 Soluções Imobiliárias"
                sizes="(max-width: 767px) 100vw, 45vw"
                placeholder="blur"
              />
            </div>
            <div className={s.quemTexto} data-revelar="direita">
              <span className="sobretitulo">Quem somos</span>
              <h2 id="t-quem" className="titulo-secao">
                Uma imobiliária que acompanha você em cada passo
              </h2>
              <p>
                A {site.nome} tem sede em Alameda Paulista, Paulista – PE, e ajuda quem quer comprar, alugar ou anunciar um
                imóvel.
              </p>
              <p>
                Trabalhamos com lançamentos de construtoras parceiras, imóveis do Minha Casa Minha Vida e locação — sempre
                com um corretor que explica cada etapa, da visita à assinatura do contrato.
              </p>
              <ul className={s.diferenciais}>
                {DIFERENCIAIS.map((d) => (
                  <li key={d}>
                    <span>
                      <Icone nome="check" tamanho={16} espessura={2.4} />
                    </span>
                    {d}
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
                <Icone nome="coracao" tamanho={16} preenchido /> Clientes A3
              </span>
              <h2 id="t-depo" className="titulo-secao">
                Quem já encontrou o lar <span>com a A3</span>
              </h2>
              <p>Histórias de quem saiu da busca com a chave na mão.</p>
            </div>
            <div className={`${s.depoGrade} carrossel-mobile`} data-revelar-filhos>
              {DEPOIMENTOS.map((d) => (
                <figure key={d.nome} className={s.depoimento}>
                  <span className={s.selo}>
                    <Icone nome={d.icone} tamanho={14} espessura={2} preenchido={d.icone === 'coracao'} />
                    {d.selo}
                  </span>
                  <blockquote>“{d.texto}”</blockquote>
                  <figcaption>
                    <span aria-hidden="true">{d.nome[0]}</span>
                    <span>
                      <strong>{d.nome}</strong>
                      <span>{d.ocupacao}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="contato" aria-labelledby="t-contato" className={s.contato}>
          <div className={`container ${s.contatoGrade}`}>
            <div className={s.contatoInfo} data-revelar="esquerda">
              <span className="sobretitulo">Contato</span>
              <h2 id="t-contato" className="titulo-secao">
                Fale com um corretor
              </h2>
              <p className={s.contatoLead}>
                Chame no WhatsApp ou deixe seus dados — um corretor da A3 retorna para você.
              </p>
              <ul className={s.canais}>
                <li>
                  <a href={linkWhatsApp()} target="_blank" rel="noopener">
                    <span className={s.canalIcone}>
                      <Icone nome="whatsapp" tamanho={22} />
                    </span>
                    <span>
                      <span>WhatsApp e telefone</span>
                      <strong>{site.telefoneExibicao}</strong>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`}>
                    <span className={s.canalIcone}>
                      <Icone nome="email" tamanho={22} />
                    </span>
                    <span>
                      <span>E-mail</span>
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
                      <span>Escritório</span>
                      <strong>{site.endereco.exibicao}</strong>
                    </span>
                  </div>
                </li>
              </ul>
              <MapaEstatico
                consulta={`${site.nome}, ${site.endereco.logradouro}, ${site.endereco.bairro}, ${site.endereco.cidade} - ${site.endereco.uf}`}
                legenda="Ver no Google Maps · escritório A3"
              />
            </div>
            <div className={s.contatoForm} data-revelar="direita">
              <FormularioContato />
            </div>
          </div>
        </section>
      </main>
      <Rodape />
      <BotaoWhatsApp />
      <RevelarAoRolar />
    </>
  )
}
