import Link from 'next/link'
import { caminhoDaRota, ROTA_VAZIA, type FiltrosRota } from '@/lib/imoveis/filtros'
import { MIN_MCMV_CIDADE, caminhoMcmv } from '@/lib/imoveis/mcmv'
import { paginasRelacionadas, type PaginaBusca } from '@/lib/imoveis/paginas'
import { paragrafosDaBusca, textosDaBusca } from '@/lib/imoveis/rotas'
import type { Cidade } from '@/lib/imoveis/tipos'
import s from './Busca.module.css'

interface Grupo {
  titulo: string
  itens: { href: string; rotulo: string; total?: number }[]
}

/**
 * Texto descritivo e links para outras buscas, num cartão no fim dos resultados. Tudo vem do catálogo: nada aqui é frase
 * solta sobre o mercado.
 */
export function TextoSeoBusca({ rota, cidades, paginas }: { rota: FiltrosRota; cidades: Cidade[]; paginas: PaginaBusca[] }) {
  const pagina = paginas.find((p) => p.caminho === caminhoDaRota(rota))
  if (!pagina || pagina.total === 0) return null

  const { h1 } = textosDaBusca(rota, cidades)
  const cidade = cidades.find((c) => c.slug === rota.cidade)
  const bairro = cidade?.bairros.find((b) => b.slug === rota.bairro)
  const relacionadas = paginasRelacionadas(paginas, pagina)
  const link = (p: PaginaBusca) => ({ href: p.caminho, rotulo: textosDaBusca(p.rota, cidades).h1, total: p.total })

  // A página do programa Minha Casa Minha Vida da cidade (ou a geral, se a busca não tem cidade).
  const paginaCidade = rota.cidade ? paginas.find((p) => p.caminho === caminhoDaRota({ ...ROTA_VAZIA, cidade: rota.cidade })) : undefined
  const mcmv =
    rota.cidade && cidade && (paginaCidade?.mcmv ?? 0) >= MIN_MCMV_CIDADE
      ? { href: caminhoMcmv(rota.cidade), rotulo: `Minha Casa Minha Vida em ${cidade.nome}` }
      : !rota.cidade && pagina.mcmv >= MIN_MCMV_CIDADE
        ? { href: caminhoMcmv(), rotulo: 'Minha Casa Minha Vida em Paulista, Recife e região' }
        : null

  const grupos: Grupo[] = [
    { titulo: bairro ? `Outros bairros de ${cidade!.nome}` : cidade ? `Bairros de ${cidade.nome}` : '', itens: relacionadas.bairros.map(link) },
    { titulo: rota.cidade ? 'Outras cidades' : 'Cidades', itens: relacionadas.cidades.map(link) },
    {
      titulo: `Outras buscas${bairro ? ` em ${bairro.nome}` : cidade ? ` em ${cidade.nome}` : ''}`,
      itens: [...relacionadas.outrasBuscas.map(link), ...(mcmv ? [mcmv] : [])],
    },
  ].filter((g) => g.itens.length)

  return (
    <section className={s.textoSeo} aria-labelledby="t-sobre-busca">
      <div className={s.textoSeoCorpo}>
        <h2 id="t-sobre-busca">{h1}: o que você encontra na A3</h2>
        {paragrafosDaBusca(rota, cidades, pagina).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {grupos.length > 0 && (
        <div className={s.explorarGrade}>
          {grupos.map((g) => (
            <nav key={g.titulo} aria-label={g.titulo}>
              <h3>{g.titulo}</h3>
              <ul>
                {g.itens.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href}>{i.rotulo}</Link>
                    {i.total ? <span> ({i.total})</span> : null}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      )}
    </section>
  )
}
