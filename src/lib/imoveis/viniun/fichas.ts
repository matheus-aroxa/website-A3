// Fichas dos imóveis da Viniun, com uma cópia no banco (tabela viniun_fichas, db/viniun.sql).
// A lista de slugs (GET /imoveis/slugs) traz a data de atualização de cada imóvel: só as fichas novas ou alteradas
// são baixadas de novo. Sem a cópia, seriam ~330 chamadas a cada atualização do cache (e a cada deploy), ~40 s pelo limite
// da Viniun. Se a Viniun estiver fora do ar, vale a última cópia. Sem a tabela, tudo é baixado (funciona, só é lento).
import 'server-only'
import { banco } from '@/lib/db'
import { emLotes, lerTodasAsPaginas, lerViniun, type CardViniun, type ImovelViniun, type PaginaViniun, type SlugViniun } from './api'

export interface Ficha {
  ficha: ImovelViniun
  mcmv: boolean
}

const TABELA_INEXISTENTE = '42P01'
const semTabela = (erro: unknown) => (erro as { code?: string }).code === TABELA_INEXISTENTE

/** Todos os imóveis "no site" da Viniun, com a data de atualização (ordem estável, ao contrário da busca paginada). */
async function listarSlugs(): Promise<SlugViniun[]> {
  const itens: SlugViniun[] = []
  for (let pagina = 1; ; pagina++) {
    const resposta = await lerViniun<PaginaViniun<SlugViniun>>('/imoveis/slugs', { page: pagina })
    if (!resposta) break
    itens.push(...resposta.data)
    if (pagina >= resposta.meta.ultima_pagina || resposta.data.length === 0) break
  }
  return [...new Map(itens.map((s) => [s.slug, s])).values()]
}

interface Linha {
  slug: string
  atualizado_em: string
  mcmv: boolean
  dados: ImovelViniun
}

async function lerCopia(slugs?: string[]): Promise<{ linhas: Map<string, Linha>; ok: boolean }> {
  try {
    const { rows } = await banco().query<Linha>(
      `SELECT slug, atualizado_em, mcmv, dados FROM viniun_fichas${slugs ? ' WHERE slug = ANY($1)' : ''}`,
      slugs ? [slugs] : [],
    )
    return { linhas: new Map(rows.map((r) => [r.slug, r])), ok: true }
  } catch (erro) {
    if (semTabela(erro)) return { linhas: new Map(), ok: false }
    throw erro
  }
}

async function gravarCopia(novas: { slug: string; atualizado_em: string; dados: ImovelViniun }[], todos: string[], mcmv: string[]) {
  const cliente = banco()
  if (novas.length) {
    await cliente.query(
      `INSERT INTO viniun_fichas (slug, atualizado_em, dados)
       SELECT x.slug, x.atualizado_em, x.dados FROM jsonb_to_recordset($1::jsonb) AS x(slug text, atualizado_em text, dados jsonb)
       ON CONFLICT (slug) DO UPDATE SET atualizado_em = EXCLUDED.atualizado_em, dados = EXCLUDED.dados, baixado_em = now()`,
      [JSON.stringify(novas)],
    )
  }
  await cliente.query('UPDATE viniun_fichas SET mcmv = (slug = ANY($1)) WHERE mcmv IS DISTINCT FROM (slug = ANY($1))', [mcmv])
  // Saiu do site da Viniun: sai da cópia.
  await cliente.query('DELETE FROM viniun_fichas WHERE NOT (slug = ANY($1))', [todos])
}

/** As fichas de todos os imóveis no site da Viniun. */
export async function lerFichas(): Promise<Ficha[]> {
  let slugs: SlugViniun[]
  let mcmv: Set<string>
  try {
    ;[slugs, mcmv] = await Promise.all([
      listarSlugs(),
      // A ficha não diz se é Minha Casa Minha Vida; só o filtro da busca sabe.
      lerTodasAsPaginas<CardViniun>('/imoveis', { mcmv: 1, ordem: 'menor-valor' }).then((c) => new Set(c.map((x) => x.slug))),
    ])
  } catch (erro) {
    // Viniun fora do ar: segue com a última cópia, se houver.
    const { linhas } = await lerCopia()
    if (!linhas.size) throw erro
    console.error('[viniun] fora do ar, usando a última cópia das fichas:', erro)
    return [...linhas.values()].map((l) => ({ ficha: l.dados, mcmv: l.mcmv }))
  }

  const copia = await lerCopia(slugs.map((s) => s.slug))
  const versao = (s: SlugViniun) => s.atualizado_em ?? ''
  const faltando = slugs.filter((s) => copia.linhas.get(s.slug)?.atualizado_em !== versao(s))
  const baixadas = await emLotes(faltando, 6, async (s) => {
    const dados = await lerViniun<ImovelViniun>(`/imoveis/${encodeURIComponent(s.slug)}`)
    return dados ? { slug: s.slug, atualizado_em: versao(s), dados } : null // saiu do ar entre a lista e a ficha
  })
  const novas = baixadas.filter((b) => b !== null)
  if (copia.ok) {
    await gravarCopia(novas, slugs.map((s) => s.slug), [...mcmv]).catch((erro) => console.error('[viniun] cópia das fichas não gravada:', erro))
  }

  const porSlug = new Map(novas.map((n) => [n.slug, n.dados]))
  return slugs.flatMap((s) => {
    const ficha = porSlug.get(s.slug) ?? copia.linhas.get(s.slug)?.dados
    return ficha ? [{ ficha, mcmv: mcmv.has(s.slug) }] : []
  })
}

/** Cidade, bairro e tipo de cada imóvel (para o proxy): da cópia no banco ou, sem ela, da listagem da Viniun. */
export async function lerLocais(): Promise<{ cidade: string | null; uf: string | null; bairro: string | null; tipo_slug: string | null }[]> {
  try {
    const { rows } = await banco().query<{ cidade: string | null; uf: string | null; bairro: string | null; tipo_slug: string | null }>(
      `SELECT dados->'localizacao'->>'cidade' AS cidade, dados->'localizacao'->>'uf' AS uf,
              dados->'localizacao'->>'bairro' AS bairro, dados->'tipo'->>'slug' AS tipo_slug FROM viniun_fichas`,
    )
    if (rows.length) return rows
  } catch (erro) {
    if (!semTabela(erro)) throw erro
  }
  return lerTodasAsPaginas<CardViniun>('/imoveis', { ordem: 'menor-valor' })
}
