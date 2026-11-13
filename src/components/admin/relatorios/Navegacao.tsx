'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import s from './Relatorios.module.css'

export const ABAS = [
  { href: '/admin/relatorios', rotulo: 'Visão geral', periodo: true },
  { href: '/admin/relatorios/audiencia', rotulo: 'Audiência', periodo: true },
  { href: '/admin/relatorios/origens', rotulo: 'Origens', periodo: true },
  { href: '/admin/relatorios/paginas', rotulo: 'Páginas', periodo: true },
  { href: '/admin/relatorios/buscas', rotulo: 'Buscas', periodo: true },
  { href: '/admin/relatorios/imoveis', rotulo: 'Imóveis', periodo: true, soComCatalogo: true },
  { href: '/admin/relatorios/conversoes', rotulo: 'Conversões', periodo: true },
  null,
  { href: '/admin/relatorios/catalogo', rotulo: 'Catálogo', periodo: false, soComCatalogo: true },
  { href: '/admin/relatorios/construtoras', rotulo: 'Construtoras', periodo: true, soComCatalogo: true },
] as const

/**
 * Abas dos relatórios. Mantém o período escolhido ao trocar de aba.
 * Com o catálogo na Viniun (`catalogo` falso), somem as abas que leem o cadastro do banco (Imóveis, Catálogo e Construtoras).
 */
export function NavegacaoRelatorios({ catalogo }: { catalogo: boolean }) {
  const abas = ABAS.filter((a) => a === null ? catalogo : catalogo || !('soComCatalogo' in a))
  const caminho = usePathname()
  const params = useSearchParams()
  const consulta = new URLSearchParams([...params].filter(([k]) => ['p', 'de', 'ate'].includes(k))).toString()
  return (
    <div className={s.abas}>
      <nav className={`container ${s.abasLista}`} aria-label="Relatórios">
        {abas.map((a, i) =>
          a === null ? (
            <span key={i} className={s.abaSeparador} aria-hidden="true" />
          ) : (
            <Link key={a.href} href={a.periodo && consulta ? `${a.href}?${consulta}` : a.href} className={s.aba} aria-current={caminho === a.href ? 'page' : undefined} prefetch={false}>
              {a.rotulo}
            </Link>
          ),
        )}
      </nav>
    </div>
  )
}
