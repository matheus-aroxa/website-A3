import Image from 'next/image'
import Link from 'next/link'
import logoNegativo from '@/assets/marca/logo-a3-negativo.png'
import { anoAtual, linkWhatsApp, mensagensWhatsApp, site } from '@/lib/site'
import s from './Rodape.module.css'

const NAVEGACAO = [
  { href: '/imoveis/venda', rotulo: 'Imóveis à venda' },
  { href: '/imoveis/aluguel', rotulo: 'Imóveis para alugar' },
  { href: '/imoveis/lancamentos', rotulo: 'Lançamentos' },
  { href: '/#quem-somos', rotulo: 'Quem somos' },
]

const BUSCAS_FREQUENTES = [
  { href: '/imoveis/apartamentos/paulista/janga', rotulo: 'Apartamentos no Janga' },
  { href: '/imoveis/casas/paulista/pau-amarelo', rotulo: 'Casas em Pau Amarelo' },
  { href: '/imoveis/lancamentos/paulista/jaguaribe', rotulo: 'Lançamentos em Jaguaribe' },
  { href: '/imoveis/igarassu', rotulo: 'Imóveis em Igarassu' },
  { href: '/imoveis/apartamentos/recife', rotulo: 'Apartamentos no Recife' },
]

export function Rodape({ comBarraInferior = false }: { comBarraInferior?: boolean }) {
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
            <a href={linkWhatsApp(mensagensWhatsApp.anunciar)} target="_blank" rel="noopener" className={s.link}>
              Anunciar meu imóvel
            </a>
          </nav>
          <nav aria-label="Buscas frequentes" className={s.coluna}>
            <strong>Buscas frequentes</strong>
            {BUSCAS_FREQUENTES.map((l) => (
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
          {/* scroll={false}: a própria página anima a rolagem até o topo (RolarAoTopo). */}
          <div className={s.linksBase}>
            <Link href="/politica-de-privacidade" scroll={false} className={s.link}>
              Política de privacidade
            </Link>
            <Link href="/admin" className={s.link}>
              Área administrativa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
