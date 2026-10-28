// Consultas do site ao catálogo, feitas no próprio SQL: filtros, ordenação e paginação rodam no banco
// e só voltam as linhas de que a página precisa (nunca o catálogo inteiro). O cache fica em repositorio.ts.
import 'server-only'
import { banco } from '@/lib/db'
import { CONSULTA_SITE, paraImovel, type Linha } from './banco'
import { POR_PAGINA, type Entrega, type Filtros, type Ordem } from './filtros'
import { altDaFoto, nomeDoLocal, normalizarBusca } from './formato'
import type { IndiceImovel } from './rotas'
import { SLUG_CONSTRUTORA_PADRAO, type Cidade, type Construtora, type Imovel, type ImovelResumo } from './tipos'

const FIM_DO_ANO: Record<Exclude<Entrega, 'pronto'>, string> = { '2026': '2026-12', '2027': '2027-12', '2028': '2028-12' }

// Sem extensão `unaccent`: tira os acentos do português com translate (mesmo efeito de normalizarBusca).
export const SEM_ACENTO = (texto: string) =>
  `translate(lower(${texto}), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')`

const DE = `
  FROM imoveis i
  JOIN bairros b ON b.id = i.bairro_id
  JOIN cidades c ON c.id = b.cidade_id
  JOIN construtoras co ON co.id = i.construtora_id`

const ORDEM_SQL: Record<Ordem, string> = {
  recentes: 'i.publicado_em DESC, i.id',
  'menor-preco': 'i.preco, i.id',
  'maior-preco': 'i.preco DESC, i.id',
  'maior-area': 'i.area_max DESC, i.id',
  'mais-quartos': 'i.quartos_max DESC, i.id',
}

/** Condições da busca (mesma regra de antes, agora em SQL) e seus parâmetros. */
function onde(f: Filtros) {
  const params: unknown[] = []
  const p = (valor: unknown) => `$${params.push(valor)}`
  // Só aparece na busca o imóvel publicado e com ao menos uma foto (a capa vem dela).
  const c = ["i.status = 'ativo'", 'EXISTS (SELECT 1 FROM fotos f WHERE f.imovel_id = i.id)']

  if (f.categoria !== 'todos') c.push(`i.finalidade = ${p(f.categoria)}`)
  if (f.situacoes.length) c.push(`i.situacao = ANY(${p(f.situacoes)}::situacao[])`)
  if (f.tipos.length) c.push(`i.tipo = ANY(${p(f.tipos)}::tipo_imovel[])`)
  if (f.cidade) c.push(`c.slug = ${p(f.cidade)}`)
  if (f.bairro) c.push(`b.slug = ${p(f.bairro)}`)
  if (f.construtoras.length) c.push(`co.slug = ANY(${p(f.construtoras)}::text[])`)
  if (f.quartos) c.push(`i.quartos_max >= ${p(f.quartos)}`)
  if (f.banheiros) c.push(`i.banheiros_max >= ${p(f.banheiros)}`)
  if (f.vagas) c.push(`COALESCE(i.vagas_max, 0) >= ${p(f.vagas)}`)
  if (f.mcmv) c.push('i.mcmv')
  if (f.areaMin) c.push(`i.area_max >= ${p(f.areaMin)}`)
  if (f.areaMax) c.push(`i.area_min <= ${p(f.areaMax)}`)
  if (f.entrega === 'pronto') c.push("i.situacao = 'pronto'")
  else if (f.entrega) c.push(`(i.situacao = 'pronto' OR (i.entrega IS NOT NULL AND i.entrega <= ${p(FIM_DO_ANO[f.entrega])}))`)
  if (f.q.trim()) {
    const alvo = SEM_ACENTO("i.nome || ' ' || i.codigo")
    for (const termo of normalizarBusca(f.q).split(/\s+/)) c.push(`strpos(${alvo}, ${p(termo)}) > 0`)
  }
  return { where: c.join(' AND '), params }
}

// ---------- Resumos (cards) ----------

const COLUNAS_RESUMO = `
  i.id, i.codigo, i.slug, i.nome, i.tipo, i.finalidade, i.situacao, b.nome AS bairro, c.nome AS cidade,
  i.preco::float8 AS preco, i.area_min::float8 AS area_min, i.area_max::float8 AS area_max,
  i.quartos_min, i.quartos_max, i.banheiros_min, i.banheiros_max, i.vagas_min, i.vagas_max, i.entrega,
  cp.src AS capa_src, cp.largura AS capa_largura, cp.altura AS capa_altura, cp.posicao AS capa_posicao`

// A capa marcada (ou, sem marcação, a primeira foto), sem trazer a galeria.
const CAPA = `
  LEFT JOIN LATERAL (
    SELECT f.src, f.largura, f.altura, f.posicao FROM fotos f WHERE f.imovel_id = i.id ORDER BY f.capa DESC, f.posicao LIMIT 1
  ) cp ON true`

interface LinhaResumo {
  id: string
  codigo: string
  slug: string
  nome: string
  tipo: ImovelResumo['tipo']
  finalidade: ImovelResumo['finalidade']
  situacao: ImovelResumo['situacao']
  bairro: string
  cidade: string
  preco: number
  area_min: number
  area_max: number
  quartos_min: number
  quartos_max: number
  banheiros_min: number
  banheiros_max: number
  vagas_min: number | null
  vagas_max: number | null
  entrega: string | null
  capa_src: string
  capa_largura: number
  capa_altura: number
  capa_posicao: number
}

function paraResumo(l: LinhaResumo): ImovelResumo {
  const bairro = nomeDoLocal(l.bairro)
  return {
    id: l.id,
    codigo: l.codigo,
    slug: l.slug,
    nome: l.nome,
    tipo: l.tipo,
    finalidade: l.finalidade,
    situacao: l.situacao,
    local: { bairro, cidade: l.cidade },
    preco: l.preco,
    area: { min: l.area_min, max: l.area_max },
    quartos: { min: l.quartos_min, max: l.quartos_max },
    banheiros: { min: l.banheiros_min, max: l.banheiros_max },
    vagas: l.vagas_min === null || l.vagas_max === null ? null : { min: l.vagas_min, max: l.vagas_max },
    entrega: l.entrega ?? undefined,
    capa: { src: l.capa_src, width: l.capa_largura, height: l.capa_altura, alt: altDaFoto({ ...l, bairro }, l.capa_posicao) },
  }
}

export interface PaginaResumos {
  itens: ImovelResumo[]
  total: number
  pagina: number
  totalPaginas: number
}

export async function contarImoveis(f: Filtros): Promise<number> {
  const { where, params } = onde(f)
  const { rows } = await banco().query<{ n: number }>(`SELECT count(*)::int AS n ${DE} WHERE ${where}`, params)
  return rows[0]!.n
}

/** Uma página da busca: o banco filtra, ordena e corta; volta só o que aparece na página. */
export async function buscarPagina(f: Filtros, pagina: number, porPagina = POR_PAGINA): Promise<PaginaResumos> {
  const total = await contarImoveis(f)
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const atual = Math.min(pagina, totalPaginas)
  const { where, params } = onde(f)
  const { rows } = await banco().query<LinhaResumo>(
    `SELECT ${COLUNAS_RESUMO} ${DE} ${CAPA} WHERE ${where}
      ORDER BY ${ORDEM_SQL[f.ordem]} LIMIT ${porPagina} OFFSET ${(atual - 1) * porPagina}`,
    params,
  )
  return { itens: rows.map(paraResumo), total, pagina: atual, totalPaginas }
}

// ---------- Vitrine e semelhantes ----------

// Enquanto a vitrine não é personalizada valem as marcações originais do catálogo; depois, as tabelas vitrine_*.
const VITRINE = `
  CROSS JOIN vitrine_config vc
  LEFT JOIN vitrine_destaques vd ON vd.imovel_id = i.id`
const DESTAQUE = 'CASE WHEN vc.personalizada THEN vd.imovel_id IS NOT NULL ELSE i.destaque END'
const HEROI = 'COALESCE(CASE WHEN vc.personalizada THEN vc.heroi_id = i.id ELSE i.heroi END, false)'

export async function buscarDestaques(limite: number): Promise<ImovelResumo[]> {
  const { rows } = await banco().query<LinhaResumo>(
    `SELECT ${COLUNAS_RESUMO} ${DE} ${VITRINE} ${CAPA}
      WHERE i.status = 'ativo' AND (${DESTAQUE})
      ORDER BY (CASE WHEN vc.personalizada THEN vd.posicao END), i.publicado_em DESC, i.id LIMIT $1`,
    [limite],
  )
  return rows.map(paraResumo)
}

/** Imóvel do topo da home: o "herói" ou, na falta, o destaque mais recente (ou o mais recente de todos). */
export async function buscarHeroi(): Promise<Imovel | null> {
  const { rows } = await banco().query<Linha>(
    `${CONSULTA_SITE} ${VITRINE}
      WHERE i.status = 'ativo'
      ORDER BY ${HEROI} DESC, COALESCE(${DESTAQUE}, false) DESC, i.publicado_em DESC, i.id LIMIT 1`,
  )
  return rows[0] ? paraImovel(rows[0]) : null
}

/** Mesma finalidade e cidade; mesma situação de obra primeiro, depois os mais recentes. */
export async function buscarSemelhantes(imovel: Imovel, limite: number): Promise<ImovelResumo[]> {
  const { rows } = await banco().query<LinhaResumo>(
    `SELECT ${COLUNAS_RESUMO} ${DE} ${CAPA}
      WHERE i.status = 'ativo' AND i.id <> $1 AND i.finalidade = $2 AND c.slug = $3
        AND EXISTS (SELECT 1 FROM fotos f WHERE f.imovel_id = i.id)
      ORDER BY (i.situacao = $4) DESC, i.publicado_em DESC, i.id LIMIT $5`,
    [imovel.id, imovel.finalidade, imovel.local.cidadeSlug, imovel.situacao, limite],
  )
  return rows.map(paraResumo)
}

// ---------- Um imóvel ----------

export async function buscarAtivoPorSlug(slug: string): Promise<Imovel | null> {
  const { rows } = await banco().query<Linha>(`${CONSULTA_SITE} WHERE i.status = 'ativo' AND i.slug = $1`, [slug])
  return rows[0] ? paraImovel(rows[0]) : null
}

export async function buscarAtivoPorId(id: string): Promise<Imovel | null> {
  const { rows } = await banco().query<Linha>(`${CONSULTA_SITE} WHERE i.status = 'ativo' AND i.id = $1`, [id])
  return rows[0] ? paraImovel(rows[0]) : null
}

// ---------- Cidades e índice ----------

const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, 'pt-BR')

/** Cidades e bairros que têm imóvel publicado, em ordem alfabética. */
export async function buscarCidades(): Promise<Cidade[]> {
  const { rows } = await banco().query<{ cidade: string; cidade_slug: string; uf: string; bairro: string; bairro_slug: string }>(
    `SELECT c.nome AS cidade, c.slug AS cidade_slug, c.uf, b.nome AS bairro, b.slug AS bairro_slug
       FROM bairros b JOIN cidades c ON c.id = b.cidade_id
      WHERE EXISTS (SELECT 1 FROM imoveis i WHERE i.bairro_id = b.id AND i.status = 'ativo')`,
  )
  const mapa = new Map<string, Cidade>()
  for (const r of rows) {
    const cidade = mapa.get(r.cidade_slug) ?? { nome: r.cidade, slug: r.cidade_slug, uf: r.uf, bairros: [] }
    cidade.bairros.push({ nome: nomeDoLocal(r.bairro), slug: r.bairro_slug })
    mapa.set(r.cidade_slug, cidade)
  }
  return [...mapa.values()].map((c) => ({ ...c, bairros: c.bairros.sort(porNome) })).sort(porNome)
}

/** Construtoras com imóvel publicado, em ordem alfabética, para o filtro da busca. A padrão ("Não informado") vai por último. */
export async function buscarConstrutoras(): Promise<Construtora[]> {
  const { rows } = await banco().query<Construtora>(
    `SELECT co.id, co.nome, co.slug FROM construtoras co
      WHERE EXISTS (SELECT 1 FROM imoveis i WHERE i.construtora_id = co.id AND i.status = 'ativo')`,
  )
  return rows.sort((a, b) => Number(a.slug === SLUG_CONSTRUTORA_PADRAO) - Number(b.slug === SLUG_CONSTRUTORA_PADRAO) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** O mínimo de cada imóvel publicado, para gerar rotas e sitemap (sem descrição nem galeria). */
export async function buscarIndice(comFotos = false): Promise<IndiceImovel[]> {
  const { rows } = await banco().query<{
    slug: string
    finalidade: IndiceImovel['finalidade']
    situacao: IndiceImovel['situacao']
    tipo: IndiceImovel['tipo']
    cidade_slug: string
    bairro_slug: string
    atualizado_em: string
    preco: number
    mcmv: boolean
    quartos_min: number
    quartos_max: number
    area_min: number
    area_max: number
    fotos: string[]
  }>(
    `SELECT i.slug, i.finalidade, i.situacao, i.tipo, c.slug AS cidade_slug, b.slug AS bairro_slug,
            to_char(i.atualizado_em, 'YYYY-MM-DD') AS atualizado_em, i.preco::float8 AS preco, i.mcmv,
            i.quartos_min, i.quartos_max, i.area_min::float8 AS area_min, i.area_max::float8 AS area_max,
            ${comFotos ? "COALESCE((SELECT json_agg(f.src ORDER BY f.posicao) FROM fotos f WHERE f.imovel_id = i.id), '[]'::json)" : "'[]'::json"} AS fotos
       ${DE} WHERE i.status = 'ativo'`,
  )
  return rows.map((r) => ({
    slug: r.slug,
    finalidade: r.finalidade,
    situacao: r.situacao,
    tipo: r.tipo,
    atualizadoEm: r.atualizado_em,
    preco: r.preco,
    mcmv: r.mcmv,
    quartos: { min: r.quartos_min, max: r.quartos_max },
    area: { min: r.area_min, max: r.area_max },
    local: { cidadeSlug: r.cidade_slug, bairroSlug: r.bairro_slug },
    ...(comFotos ? { fotos: r.fotos } : {}),
  }))
}
