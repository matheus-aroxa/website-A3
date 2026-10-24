import Link from 'next/link'
import { Icone } from '@/components/ui/Icone'
import { montarUrl, type Filtros } from '@/lib/imoveis/filtros'
import s from './Busca.module.css'

/** Paginação com links reais (rastreáveis pelo Google). No celular dá lugar ao "Carregar mais". */
export function Paginacao({ filtros, pagina, totalPaginas }: { filtros: Filtros; pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginação" className={s.paginacao}>
      <ol>
        <li>
          {pagina > 1 ? (
            <Link href={montarUrl(filtros, pagina - 1)} className={s.paginaTexto} rel="prev" aria-label="Página anterior">
              <Icone nome="chevron-esquerda" tamanho={16} espessura={2} />
            </Link>
          ) : (
            <span className={`${s.paginaTexto} ${s.desativada}`} aria-disabled="true" aria-label="Página anterior">
              <Icone nome="chevron-esquerda" tamanho={16} espessura={2} />
            </span>
          )}
        </li>
        <li>
          <span className={s.pagina} aria-current="page">
            {pagina}
          </span>
        </li>
        <li>
          {pagina < totalPaginas ? (
            <Link href={montarUrl(filtros, pagina + 1)} className={s.paginaTexto} rel="next" aria-label="Próxima página">
              <Icone nome="chevron-direita" tamanho={16} espessura={2} />
            </Link>
          ) : (
            <span className={`${s.paginaTexto} ${s.desativada}`} aria-disabled="true" aria-label="Próxima página">
              <Icone nome="chevron-direita" tamanho={16} espessura={2} />
            </span>
          )}
        </li>
      </ol>
    </nav>
  )
}
