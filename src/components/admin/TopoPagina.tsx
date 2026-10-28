import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import s from './Admin.module.css'

/** Faixa verde do topo das páginas do painel (título, descrição e, opcionalmente, mais conteúdo). */
export function TopoPagina({
  titulo,
  descricao,
  voltar,
  etiquetas,
  children,
}: {
  titulo: ReactNode
  descricao?: ReactNode
  voltar?: { href: string; rotulo: string }
  etiquetas?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className={s.topo}>
      <span className={s.topoAnel} aria-hidden="true" />
      <div className={`container ${s.topoConteudo}`}>
        {voltar ? (
          <Link href={voltar.href} className={s.voltar}>
            <Icone nome="chevron-esquerda" tamanho={16} espessura={2} /> {voltar.rotulo}
          </Link>
        ) : (
          <span className={s.sobretitulo}>Painel A3</span>
        )}
        {etiquetas && <div className={s.topoEtiquetas}>{etiquetas}</div>}
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
        {children}
      </div>
    </section>
  )
}

/** Área cinza abaixo do topo, onde ficam os cartões. */
export function CorpoPagina({ children }: { children: ReactNode }) {
  return (
    <div className={`container ${s.corpo}`}>
      {children}
    </div>
  )
}

/** Cartão branco de uma seção, com o ícone em quadrado verde-claro do protótipo. */
export function Secao({
  id,
  icone,
  titulo,
  descricao,
  extra,
  children,
}: {
  id?: string
  icone: ReactNode
  titulo: string
  descricao?: ReactNode
  /** Conteúdo à direita do título (ex.: "6 fotos", "2 de 3"). */
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className={s.secao} aria-labelledby={id ? `${id}-titulo` : undefined}>
      <div className={s.secaoTopo}>
        <span className={s.secaoIcone}>{icone}</span>
        <div className={s.secaoTitulos}>
          <div className={s.secaoLinha}>
            <h2 id={id ? `${id}-titulo` : undefined}>{titulo}</h2>
            {extra}
          </div>
          {descricao && <p>{descricao}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
