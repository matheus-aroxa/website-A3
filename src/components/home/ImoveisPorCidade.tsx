import Link from 'next/link'
import { pluralImoveis } from '@/lib/imoveis/formato'
import type { CidadeEmDestaque } from '@/lib/imoveis/paginas'
import s from './ImoveisPorCidade.module.css'

/**
 * Links para as páginas de cada cidade e dos maiores bairros, com a contagem de imóveis. É o caminho mais curto do Google
 * (e de quem chega pela home) até as buscas por local, e os números vêm do catálogo.
 */
export function ImoveisPorCidade({
  cidades,
  mcmv,
}: {
  cidades: CidadeEmDestaque[]
  /** Página do Minha Casa Minha Vida, quando há imóveis do programa. */
  mcmv?: { href: string; total: number }
}) {
  if (!cidades.length) return null
  return (
    <section id="cidades" aria-labelledby="t-cidades" className={s.secao}>
      <div className={`container ${s.pilha}`}>
        <div className={s.cabecalho} data-revelar>
          <span className="sobretitulo">Imóveis por cidade</span>
          <h2 id="t-cidades" className="titulo-secao">
            Encontre imóveis em Paulista, Recife e região
          </h2>
          <p>Escolha a cidade ou o bairro para ver os imóveis à venda, os lançamentos e as opções para alugar.</p>
        </div>
        <ul className={s.grade} data-revelar-filhos>
          {cidades.slice(0, 8).map((c) => (
            <li key={c.href} className={`elevar ${s.cidade}`}>
              <Link href={c.href} className={s.cidadeLink}>
                <strong>
                  {c.nome} <span>{c.uf}</span>
                </strong>
                <span>{pluralImoveis(c.total)}</span>
              </Link>
              {c.bairros.length > 0 && (
                <ul className={s.bairros} aria-label={`Bairros de ${c.nome}`}>
                  {c.bairros.map((b) => (
                    <li key={b.href}>
                      <Link href={b.href}>{b.nome}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {mcmv && (
            <li className={`elevar ${s.cidade} ${s.programa}`}>
              <Link href={mcmv.href} className={s.cidadeLink}>
                <strong>Minha Casa Minha Vida</strong>
                <span>{pluralImoveis(mcmv.total)} do programa</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}
