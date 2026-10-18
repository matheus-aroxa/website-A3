import Link from 'next/link'
import { Icone } from '@/components/ui/Icone'
import { montarUrl, type Filtros } from '@/lib/imoveis/filtros'
import s from './Busca.module.css'

function paginasVisiveis(atual: number, total: number): (number | '…')[] {
  const paginas = new Set([1, total, atual - 1, atual, atual + 1].filter((p) => p >= 1 && p <= total))
  const ordenadas = [...paginas].sort((a, b) => a - b)
  return ordenadas.flatMap((p, i) => (i > 0 && p - ordenadas[i - 1]! > 1 ? (['…', p] as const) : [p]))
}

/** Paginação com links reais (rastreáveis pelo Google). No celular dá lugar ao "Carregar mais". */
export function Paginacao({ filtros, pagina, totalPaginas }: { filtros: Filtros; pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginação" className={s.paginacao}>
      <ol>
        {pagina > 1 && (
          <li>
            <Link href={montarUrl(filtros, pagina - 1)} className={s.paginaTexto} rel="prev">
              <Icone nome="chevron-esquerda" tamanho={16} espessura={2} /> Anterior
            </Link>
          </li>
        )}
        {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
          p === '…' ? (
            <li key={`r${i}`} aria-hidden="true" className={s.reticencias}>
              …
            </li>
          ) : (
            <li key={p}>
              <Link href={montarUrl(filtros, p)} className={s.pagina} aria-current={p === pagina ? 'page' : undefined}>
                {p}
              </Link>
            </li>
          )
        )}
        {pagina < totalPaginas && (
          <li>
            <Link href={montarUrl(filtros, pagina + 1)} className={s.paginaTexto} rel="next">
              Próxima <Icone nome="chevron-direita" tamanho={16} espessura={2} />
            </Link>
          </li>
        )}
      </ol>
    </nav>
  )
}
