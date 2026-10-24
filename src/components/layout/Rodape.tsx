import Image from 'next/image'
import Link from 'next/link'
import logoNegativo from '@/assets/marca/logo-a3-negativo.png'
import { CAMINHO_MCMV } from '@/lib/imoveis/mcmv'
import { cidadesEmDestaque } from '@/lib/imoveis/paginas'
import { listarCidades, listarPaginasDeBusca } from '@/lib/imoveis/repositorio'
import { anoAtual, linkWhatsApp, mensagensWhatsApp, site } from '@/lib/site'
import s from './Rodape.module.css'

const NAVEGACAO = [
  { href: '/imoveis/venda', rotulo: 'Imóveis à venda' },
  { href: '/imoveis/aluguel', rotulo: 'Imóveis para alugar' },
  { href: '/imoveis/lancamentos', rotulo: 'Lançamentos' },
  { href: '/#quem-somos', rotulo: 'Quem somos' },
]

/** As três cidades e os três bairros com mais imóveis: links de todas as páginas para as buscas que mais importam. */
function buscasFrequentes(paginas: Awaited<ReturnType<typeof listarPaginasDeBusca>>, cidades: Awaited<ReturnType<typeof listarCidades>>) {
  const destaques = cidadesEmDestaque(paginas, cidades, 3)
  const bairros = destaques.flatMap((c) => c.bairros.map((b) => ({ href: b.href, total: b.total, rotulo: `Imóveis em ${b.nome}, ${c.nome}` })))
  return [
    ...destaques.slice(0, 3).map((c) => ({ href: c.href, rotulo: `Imóveis em ${c.nome}` })),
    ...bairros.sort((a, b) => b.total - a.total).slice(0, 3),
  ]
}

export async function Rodape({ comBarraInferior = false }: { comBarraInferior?: boolean }) {
  const [cidades, paginas] = await Promise.all([listarCidades(), listarPaginasDeBusca()])
  const temMcmv = (paginas.find((p) => p.caminho === '/imoveis')?.mcmv ?? 0) > 0
  return (
    <footer className={s.rodape} data-barra-inferior={comBarraInferior || undefined}>
      <div className={`container ${s.interno}`}>
        <div className={s.colunas}>
          <div className={s.marca}>
            <Image src={logoNegativo} alt={site.nome} width={101} height={88} />
            <p>Venda, aluguel e lançamentos de imóveis, com um corretor do primeiro contato à entrega das chaves.</p>
          </div>
          <nav aria-label="Rodapé" className={s.coluna}>
            <strong>Navegação</strong>
            {NAVEGACAO.map((l) => (
              <Link key={l.href} href={l.href} className={s.link}>
                {l.rotulo}
              </Link>
            ))}
            {temMcmv && (
              <Link href={CAMINHO_MCMV} className={s.link}>
                Minha Casa Minha Vida
              </Link>
            )}
            <a href={linkWhatsApp(mensagensWhatsApp.anunciar)} target="_blank" rel="noopener" className={s.link}>
              Anunciar meu imóvel
            </a>
          </nav>
          <nav aria-label="Buscas frequentes" className={s.coluna}>
            <strong>Buscas frequentes</strong>
            {buscasFrequentes(paginas, cidades).map((l) => (
              <Link key={l.href} href={l.href} className={s.link}>
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <div className={`${s.coluna} ${s.atendimento}`}>
            <strong>Atendimento</strong>
            <span>Fale com um corretor pelo WhatsApp ou pelo formulário de contato.</span>
            <address className={s.endereco}>
              <a href={`tel:${site.telefone.replace(/\s|-/g, '')}`} className={s.link}>
                {site.telefoneExibicao}
              </a>
              <span>{site.endereco.exibicao}</span>
            </address>
          </div>
        </div>
        <div className={s.base}>
          <span>
            © {anoAtual} {site.nome} · {site.creci}
          </span>
          {/* scroll={false}: quem anima a rolagem até o topo é o TopoAoMudarDePagina. */}
          <div className={s.linksBase}>
            <Link href="/politica-de-privacidade" scroll={false} className={s.link}>
              Política de privacidade
            </Link>
            <Link href="/admin" scroll={false} className={s.link}>
              Área administrativa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
