import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Migalha } from '@/lib/imoveis/rotas'
import { schemaMigalhas } from '@/lib/seo'
import s from './Migalhas.module.css'

/** Trilha de navegação visível + BreadcrumbList (rich result do Google). */
export function Migalhas({ itens, className }: { itens: Migalha[]; className?: string }) {
  return (
    <nav aria-label="Você está em" className={`${s.migalhas} ${className ?? ''}`}>
      <ol>
        {itens.map((m, i) => {
          const ultima = i === itens.length - 1
          return (
            <li key={m.href}>
              {ultima ? (
                <span aria-current="page">{m.nome}</span>
              ) : (
                <>
                  <Link href={m.href}>{m.nome}</Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
      <JsonLd dados={schemaMigalhas(itens)} />
    </nav>
  )
}
