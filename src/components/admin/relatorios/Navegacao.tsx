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
  { href: '/admin/relatorios/imoveis', rotulo: 'Imóveis', periodo: true },
  { href: '/admin/relatorios/conversoes', rotulo: 'Conversões', periodo: true },
  { href: '/admin/relatorios/desempenho', rotulo: 'Desempenho', periodo: true },
  null,
  { href: '/admin/relatorios/catalogo', rotulo: 'Catálogo', periodo: false },
  { href: '/admin/relatorios/construtoras', rotulo: 'Construtoras', periodo: true },
  { href: '/admin/relatorios/qualidade', rotulo: 'Qualidade', periodo: false },
  { href: '/admin/relatorios/painel', rotulo: 'Painel', periodo: true },
] as const

/** Abas dos relatórios. Mantém o período escolhido ao trocar de aba. */
export function NavegacaoRelatorios() {
  const caminho = usePathname()
  const params = useSearchParams()
  const consulta = new URLSearchParams([...params].filter(([k]) => ['p', 'de', 'ate', 'cmp'].includes(k))).toString()
  return (
    <div className={s.abas}>
      <nav className={`container ${s.abasLista}`} aria-label="Relatórios">
        {ABAS.map((a, i) =>
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
