// Consultas do painel ao catálogo, no SQL: busca, filtros, abas, contagens e paginação rodam no banco,
// e o painel recebe só a página que mostra. Sem cache: o painel sempre vê o estado atual.
import 'server-only'
import { banco } from '@/lib/db'
import { SEM_ACENTO } from './consultas'
import { normalizarBusca } from './formato'
import type { StatusImovel, Vitrine } from './painel'
import { LIMITE_DESTAQUES } from './repositorio'
import type { Finalidade, Situacao } from './tipos'

export const ABAS_ADMIN = ['ativo', 'inativo', 'vitrine'] as const
export type AbaAdmin = (typeof ABAS_ADMIN)[number]

export const POR_PAGINA_ADMIN = 24

export interface FiltroAdmin {
  aba: AbaAdmin
  q: string
  /** Situação de obra, ou 'alugar' para os de aluguel. Vazio: todas. */
  situacao: string
  finalidade: string
  /** Id da construtora. Vazio: todas. */
  construtora: string
  pagina: number
}

export interface LinhaAdmin {
  id: string
  codigo: string
  slug: string
  nome: string
  bairro: string
  cidade: string
  construtora: string
  preco: number
  finalidade: Finalidade
  situacao: Situacao
  capa: string | null
  status: StatusImovel
  criado: boolean
  heroi: boolean
  destaque: boolean
}

// Quem está no topo e na vitrine da home: as tabelas vitrine_* depois que o painel mexeu, e antes disso
// as marcações originais do catálogo (o "herói" mais recente e os destaques mais recentes, até o limite).
const BASE = `
  WITH vc AS (SELECT personalizada, heroi_id FROM vitrine_config),
  heroi_original AS (SELECT id FROM imoveis WHERE status = 'ativo' AND heroi ORDER BY publicado_em DESC, id LIMIT 1),
  destaques_originais AS (SELECT id FROM imoveis WHERE status = 'ativo' AND destaque ORDER BY publicado_em DESC, id LIMIT ${LIMITE_DESTAQUES}),
  base AS (
    SELECT i.id, i.codigo, i.slug, i.nome, i.tipo, i.finalidade, i.situacao, i.preco::float8 AS preco, i.publicado_em,
           b.nome AS bairro, c.nome AS cidade, co.nome AS construtora, i.construtora_id, i.status, (i.origem = 'painel') AS criado,
           cp.src AS capa,
           (i.status = 'ativo' AND CASE WHEN vc.personalizada THEN vc.heroi_id = i.id
                                        ELSE i.id IN (SELECT id FROM heroi_original) END) AS heroi,
           (i.status = 'ativo' AND CASE WHEN vc.personalizada THEN EXISTS (SELECT 1 FROM vitrine_destaques vd WHERE vd.imovel_id = i.id)
                                        ELSE i.id IN (SELECT id FROM destaques_originais) END) AS destaque,
           ${SEM_ACENTO("i.nome || ' ' || i.codigo")} AS alvo
      FROM imoveis i
      JOIN bairros b ON b.id = i.bairro_id
      JOIN cidades c ON c.id = b.cidade_id
      JOIN construtoras co ON co.id = i.construtora_id
      CROSS JOIN vc
      LEFT JOIN LATERAL (SELECT f.src FROM fotos f WHERE f.imovel_id = i.id ORDER BY f.capa DESC, f.posicao LIMIT 1) cp ON true
  )`

const NA_ABA: Record<AbaAdmin, string> = {
  ativo: "status = 'ativo'",
  inativo: "status = 'inativo'",
  vitrine: '(heroi OR destaque)',
}

export interface PaginaAdmin {
  itens: LinhaAdmin[]
  /** Imóveis que atendem à aba e à busca (todas as páginas). */
  total: number
  pagina: number
  totalPaginas: number
  /** Quantos há em cada aba, sem considerar a busca. */
  contagens: Record<AbaAdmin, number>
}

export async function listarPaginaAdmin(f: FiltroAdmin): Promise<PaginaAdmin> {
  const params: unknown[] = []
  const p = (valor: unknown) => `$${params.push(valor)}`
  const c = [NA_ABA[f.aba]]
  if (f.situacao === 'alugar') c.push("finalidade = 'aluguel'")
  else if (f.situacao) c.push(`(finalidade <> 'aluguel' AND situacao = ${p(f.situacao)})`)
  if (f.finalidade) c.push(`finalidade = ${p(f.finalidade)}`)
  if (/^\d+$/.test(f.construtora)) c.push(`construtora_id = ${p(Number(f.construtora))}`)
  for (const termo of normalizarBusca(f.q).split(/\s+/).filter(Boolean)) c.push(`strpos(alvo, ${p(termo)}) > 0`)
  const onde = c.join(' AND ')

  const contagens = banco().query<Record<AbaAdmin, number>>(
    `${BASE} SELECT ${ABAS_ADMIN.map((a) => `count(*) FILTER (WHERE ${NA_ABA[a]})::int AS ${a}`).join(', ')} FROM base`,
  )
  const total = (await banco().query<{ n: number }>(`${BASE} SELECT count(*)::int AS n FROM base WHERE ${onde}`, params)).rows[0]!.n
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA_ADMIN))
  const pagina = Math.min(Math.max(1, f.pagina), totalPaginas)
  const { rows } = await banco().query<LinhaAdmin>(
    `${BASE} SELECT id, codigo, slug, nome, bairro, cidade, construtora, preco, finalidade, situacao, capa, status, criado, heroi, destaque
       FROM base WHERE ${onde}
      ORDER BY translate(lower(nome), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), id
      LIMIT ${POR_PAGINA_ADMIN} OFFSET ${(pagina - 1) * POR_PAGINA_ADMIN}`,
    params,
  )
  return { itens: rows, total, pagina, totalPaginas, contagens: (await contagens).rows[0]! }
}

// ---------- Vitrine ----------

/** Vitrine em vigor, só com imóveis publicados (as escolhas do painel ou, antes de qualquer escolha, as marcações originais do catálogo). */
export async function obterVitrineEfetiva(): Promise<Vitrine> {
  const { rows } = await banco().query<{ heroi: string | null; destaques: string[] }>(
    `${BASE}
     SELECT (SELECT id FROM base WHERE heroi LIMIT 1) AS heroi,
            COALESCE((SELECT array_agg(b.id ORDER BY vd.posicao NULLS LAST, b.publicado_em DESC, b.id)
                        FROM base b LEFT JOIN vitrine_destaques vd ON vd.imovel_id = b.id
                       WHERE b.destaque), '{}') AS destaques`,
  )
  const r = rows[0]!
  return { heroi: r.heroi, destaques: r.destaques }
}

export interface LinhaOpcaoVitrine {
  id: string
  nome: string
  codigo: string
  bairro: string
  cidade: string
  finalidade: Finalidade
  situacao: Situacao
  preco: number
  capa: string | null
}

/** Imóveis publicados que podem entrar na vitrine (só o que o seletor mostra: sem galeria nem textos). */
export async function listarOpcoesVitrine(): Promise<LinhaOpcaoVitrine[]> {
  const { rows } = await banco().query<LinhaOpcaoVitrine>(
    `${BASE} SELECT id, nome, codigo, bairro, cidade, finalidade, situacao, preco, capa
       FROM base WHERE status = 'ativo'
      ORDER BY translate(lower(nome), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), id`,
  )
  return rows
}

/** Quais destes ids são imóveis publicados. */
export async function idsAtivos(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const { rows } = await banco().query<{ id: string }>("SELECT id FROM imoveis WHERE status = 'ativo' AND id = ANY($1::text[])", [ids])
  return new Set(rows.map((r) => r.id))
}
