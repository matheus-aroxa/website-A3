'use client'

// Tabela dos relatórios: ordena pelo cabeçalho, busca por texto e mostra aos poucos.
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import { normalizarBusca } from '@/lib/imoveis/formato'
import s from './Relatorios.module.css'

export interface ColunaDaTabela {
  id: string
  titulo: string
  /** Números ficam à direita. */
  numerica?: boolean
  semOrdenar?: boolean
}

export type Celula = string | number | null | { v: string | number; t?: string; href?: string; tom?: 'atencao' | 'ruim' | 'etiqueta' }
export type LinhaDaTabela = Record<string, Celula>

const valorDe = (c: Celula) => (c !== null && typeof c === 'object' ? c.v : c)
const textoDe = (c: Celula) => (c !== null && typeof c === 'object' ? (c.t ?? String(c.v)) : c === null ? '—' : String(c))

export function TabelaDados({
  colunas,
  linhas,
  ordem,
  limite = 12,
  buscar = false,
  legenda,
}: {
  colunas: ColunaDaTabela[]
  linhas: LinhaDaTabela[]
  /** Coluna e sentido da ordenação inicial. */
  ordem?: { coluna: string; decrescente?: boolean }
  limite?: number
  buscar?: boolean
  legenda: string
}) {
  const [criterio, setCriterio] = useState(ordem ?? null)
  const [busca, setBusca] = useState('')
  const [exibidas, setExibidas] = useState(limite)

  const ordenadas = useMemo(() => {
    if (!criterio) return linhas.map((l, i) => ({ l, i }))
    return linhas
      .map((l, i) => ({ l, i }))
      .sort((a, b) => {
        const va = valorDe(a.l[criterio.coluna] ?? null)
        const vb = valorDe(b.l[criterio.coluna] ?? null)
        const d = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR')
        return (criterio.decrescente ? -d : d) || a.i - b.i
      })
  }, [linhas, criterio])

  const termo = normalizarBusca(busca)
  const casam = (l: LinhaDaTabela) => !termo || colunas.some((c) => normalizarBusca(textoDe(l[c.id] ?? null)).includes(termo))
  let mostradas = 0

  function clicar(id: string) {
    setCriterio((atual) => (atual?.coluna === id ? { coluna: id, decrescente: !atual.decrescente } : { coluna: id, decrescente: colunas.find((c) => c.id === id)?.numerica ?? false }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {buscar && (
        <label className={s.tabelaBusca}>
          <span className="sr-only">Buscar na tabela</span>
          <Icone nome="busca" tamanho={18} espessura={2} />
          <input type="search" placeholder="Buscar" value={busca} onChange={(e) => { setBusca(e.target.value); setExibidas(limite) }} />
        </label>
      )}
      <div className={s.tabelaRolagem}>
        <table className={s.tabela}>
          <caption className="sr-only">{legenda}</caption>
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.id} scope="col" data-alinhar={c.numerica ? 'fim' : undefined} aria-sort={criterio?.coluna === c.id ? (criterio.decrescente ? 'descending' : 'ascending') : undefined}>
                  {c.semOrdenar ? (
                    c.titulo
                  ) : (
                    <button type="button" className={s.ordenar} data-ativa={criterio?.coluna === c.id} onClick={() => clicar(c.id)}>
                      {c.titulo}
                      <span className={s.ordenarSeta} data-cima={(criterio?.coluna === c.id && !criterio.decrescente) || undefined} aria-hidden="true">
                        <Icone nome="chevron-baixo" tamanho={14} espessura={2.4} />
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map(({ l, i }) => {
              const visivel = casam(l)
              if (visivel) mostradas++
              const escondida = !visivel || mostradas > exibidas
              return (
                <tr key={i} hidden={escondida}>
                  {colunas.map((c, k) => {
                    const cel = l[c.id] ?? null
                    const href = cel !== null && typeof cel === 'object' ? cel.href : undefined
                    const tom = cel !== null && typeof cel === 'object' ? cel.tom : undefined
                    const conteudo = href ? <Link href={href}>{textoDe(cel)}</Link> : tom ? <span className={s.etiqueta} data-tom={tom === 'etiqueta' ? undefined : tom}>{textoDe(cel)}</span> : textoDe(cel)
                    return k === 0 ? (
                      <th key={c.id} scope="row">{conteudo}</th>
                    ) : (
                      <td key={c.id} data-alinhar={c.numerica ? 'fim' : undefined}>
                        {conteudo}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {mostradas === 0 && <p className={s.vazio}>Nada encontrado.</p>}
      </div>
      {mostradas > exibidas && (
        <button type="button" className={`${s.alternar} ${s.tabelaMais}`} onClick={() => setExibidas((n) => n + limite * 2)}>
          Mostrar mais ({mostradas - exibidas} restantes)
        </button>
      )}
    </div>
  )
}
