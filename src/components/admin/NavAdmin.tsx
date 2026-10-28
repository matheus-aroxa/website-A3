'use client'

// Cabeçalho do painel: o mesmo do site público (estilos de Cabecalho.module.css e o MenuMobile),
// com os links do painel e o "Sair" no lugar do "Fale conosco". "Administradores" só aparece para o principal.
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sair } from '@/app/admin/acoes'
import logo from '@/assets/marca/logo-a3.png'
import { LinkInicio } from '@/components/layout/LinkInicio'
import { MenuMobile } from '@/components/layout/MenuMobile'
import { Icone } from '@/components/ui/Icone'
import { site } from '@/lib/site'
import c from '@/components/layout/Cabecalho.module.css'
import s from './Admin.module.css'

const LINKS = [
  { href: '/admin', rotulo: 'Imóveis', chave: 'imoveis' },
  { href: '/admin/construtoras', rotulo: 'Construtoras', chave: 'construtoras' },
  { href: '/admin/vitrine', rotulo: 'Vitrine da home', chave: 'vitrine' },
  { href: '/admin/relatorios', rotulo: 'Relatórios', chave: 'relatorios' },
] as const

const LINKS_PRINCIPAL = [...LINKS, { href: '/admin/administradores', rotulo: 'Administradores', chave: 'administradores' }] as const

function chaveAtiva(caminho: string) {
  if (caminho === '/admin' || caminho.startsWith('/admin/imoveis')) return 'imoveis'
  if (caminho.startsWith('/admin/construtoras')) return 'construtoras'
  if (caminho.startsWith('/admin/vitrine')) return 'vitrine'
  if (caminho.startsWith('/admin/relatorios')) return 'relatorios'
  if (caminho.startsWith('/admin/administradores')) return 'administradores'
  return undefined
}

function BotaoSair({ className }: { className: string }) {
  return (
    <form action={sair}>
      <button type="submit" className={className}>
        <Icone nome="sair" tamanho={18} />
        Sair
      </button>
    </form>
  )
}

/**
 * Sem caminho (prerenderização, fallback do Suspense), nenhum link aparece como ativo
 * e o logo é um link comum (o LinkInicio lê o caminho atual).
 */
export function CabecalhoAdminEstatico({ caminho, principal = false }: { caminho?: string; principal?: boolean }) {
  const ativo = chaveAtiva(caminho ?? '')
  const links = principal ? LINKS_PRINCIPAL : LINKS
  const Inicio = caminho === undefined ? Link : LinkInicio
  return (
    <header className={c.cabecalho}>
      <div className={`container ${c.barra}`}>
        <Inicio href="/admin" className={c.logo} aria-label={`${site.nome}, painel administrativo`}>
          <Image src={logo} alt={site.nome} width={46} height={40} priority />
        </Inicio>

        <nav aria-label="Painel" className={c.nav}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={c.navLink} aria-current={ativo === l.chave ? 'page' : undefined}>
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className={c.acoes}>
          <BotaoSair className={`btn btn-linha btn-p ${s.sairTopo}`} />
          <MenuMobile links={links} ativo={ativo} rodape={<BotaoSair className="btn btn-linha btn-bloco btn-g" />} />
        </div>
      </div>
    </header>
  )
}

export function CabecalhoAdmin({ principal }: { principal: boolean }) {
  return <CabecalhoAdminEstatico caminho={usePathname()} principal={principal} />
}
