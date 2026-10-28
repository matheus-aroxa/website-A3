// Estado dos filtros da busca e sua tradução de/para URL. Usado no servidor (páginas,
// sitemap, API) e no navegador (painel de filtros), por isso não importa nada de servidor.
//
// Esquema de URL (a parte no caminho vira página indexável; o resto vai na query):
//   /imoveis/[categoria]/[tipo]/[cidade]/[bairro]?quartos=2&ordem=menor-preco&pagina=2
//   categoria: venda | aluguel | lancamentos     tipo: apartamentos | casas | terrenos
// Todos os segmentos são opcionais, mas mantêm essa ordem.

import { SITUACOES, TIPOS, rotuloSituacao, rotuloTipo } from './formato'
import type { Cidade, Construtora, Situacao, TipoImovel } from './tipos'

export type Categoria = 'todos' | 'venda' | 'aluguel'
export type Ordem = 'recentes' | 'menor-preco' | 'maior-preco' | 'maior-area' | 'mais-quartos'
export type Entrega = 'pronto' | '2026' | '2027' | '2028'

export interface Filtros {
  categoria: Categoria
  situacoes: Situacao[]
  tipos: TipoImovel[]
  cidade: string | null
  bairro: string | null
  /** Slugs das construtoras escolhidas (qualquer uma delas). */
  construtoras: string[]
  quartos: number
  banheiros: number
  vagas: number
  mcmv: boolean
  areaMin: number | null
  areaMax: number | null
  entrega: Entrega | null
  q: string
  ordem: Ordem
}

export const FILTROS_PADRAO: Filtros = {
  categoria: 'todos',
  situacoes: [],
  tipos: [],
  cidade: null,
  bairro: null,
  construtoras: [],
  quartos: 0,
  banheiros: 0,
  vagas: 0,
  mcmv: false,
  areaMin: null,
  areaMax: null,
  entrega: null,
  q: '',
  ordem: 'recentes',
}

export const POR_PAGINA = 9

/** Quantas construtoras a busca aceita de uma vez (limita o tamanho da URL e da consulta). */
export const MAX_CONSTRUTORAS = 30

export const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'menor-preco', rotulo: 'Menor preço' },
  { valor: 'maior-preco', rotulo: 'Maior preço' },
  { valor: 'maior-area', rotulo: 'Maior área' },
  { valor: 'mais-quartos', rotulo: 'Mais quartos' },
]

export const ENTREGAS: { valor: Entrega; rotulo: string }[] = [
  { valor: 'pronto', rotulo: 'Pronto para morar' },
  { valor: '2026', rotulo: 'Até dez/2026' },
  { valor: '2027', rotulo: 'Até dez/2027' },
  { valor: '2028', rotulo: 'Até dez/2028' },
]

/** "Lançamentos" no caminho equivale a venda + estas situações. */
export const SITUACOES_LANCAMENTO: Situacao[] = ['breve-lancamento', 'lancamento']

export const SLUG_TIPO: Record<TipoImovel, string> = {
  apartamento: 'apartamentos',
  'casa-condominio': 'casas',
  terreno: 'terrenos',
}
const TIPO_POR_SLUG = Object.fromEntries(Object.entries(SLUG_TIPO).map(([t, s]) => [s, t])) as Record<
  string,
  TipoImovel
>

export type CategoriaRota = 'venda' | 'aluguel' | 'lancamentos'
const CATEGORIAS_ROTA: CategoriaRota[] = ['venda', 'aluguel', 'lancamentos']

/** Filtros que vêm do caminho da URL. */
export interface FiltrosRota {
  categoria: CategoriaRota | null
  tipo: TipoImovel | null
  cidade: string | null
  bairro: string | null
}

export const ROTA_VAZIA: FiltrosRota = { categoria: null, tipo: null, cidade: null, bairro: null }

/** Lê os segmentos do caminho. Retorna `null` quando a combinação não existe (→ 404). */
export function interpretarSegmentos(segmentos: string[] | undefined, cidades: Cidade[]): FiltrosRota | null {
  const resto = [...(segmentos ?? [])].map((s) => decodeURIComponent(s).toLowerCase())
  const rota: FiltrosRota = { ...ROTA_VAZIA }

  if (resto[0] && (CATEGORIAS_ROTA as string[]).includes(resto[0])) rota.categoria = resto.shift() as CategoriaRota
  if (resto[0] && TIPO_POR_SLUG[resto[0]]) rota.tipo = TIPO_POR_SLUG[resto.shift()!]!
  const cidade = resto[0] ? cidades.find((c) => c.slug === resto[0]) : undefined
  if (cidade) {
    rota.cidade = resto.shift()!
    if (resto[0] && cidade.bairros.some((b) => b.slug === resto[0])) rota.bairro = resto.shift()!
  }
  return resto.length === 0 ? rota : null
}

export function segmentosDaRota(rota: FiltrosRota): string[] {
  return [rota.categoria, rota.tipo && SLUG_TIPO[rota.tipo], rota.cidade, rota.cidade && rota.bairro].filter(
    (s): s is string => Boolean(s)
  )
}

export function caminhoDaRota(rota: FiltrosRota) {
  return ['/imoveis', ...segmentosDaRota(rota)].join('/')
}

type ParametrosBrutos = URLSearchParams | Record<string, string | string[] | undefined>

function paraURLSearchParams(sp: ParametrosBrutos): URLSearchParams {
  if (sp instanceof URLSearchParams) return sp
  const out = new URLSearchParams()
  for (const [chave, valor] of Object.entries(sp)) {
    if (Array.isArray(valor)) valor.forEach((v) => out.append(chave, v))
    else if (valor !== undefined) out.append(chave, valor)
  }
  return out
}

const inteiro = (v: string | null, max: number) => {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0
}
const numeroOuNulo = (v: string | null) => {
  const n = Number.parseFloat((v ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}
const unicos = <T,>(lista: T[]) => [...new Set(lista)]

/** Combina caminho + query num estado de filtros completo e válido. */
export function lerFiltros(rota: FiltrosRota, query: ParametrosBrutos): { filtros: Filtros; pagina: number } {
  const sp = paraURLSearchParams(query)
  const situacoesQuery = sp.getAll('situacao').filter((s): s is Situacao => (SITUACOES as string[]).includes(s))
  const tiposQuery = sp.getAll('tipo').filter((t): t is TipoImovel => (TIPOS as string[]).includes(t))
  const ordem = sp.get('ordem')
  const entrega = sp.get('entrega')

  const filtros: Filtros = {
    ...FILTROS_PADRAO,
    categoria: rota.categoria === 'aluguel' ? 'aluguel' : rota.categoria ? 'venda' : 'todos',
    situacoes: unicos(rota.categoria === 'lancamentos' ? [...SITUACOES_LANCAMENTO, ...situacoesQuery] : situacoesQuery),
    tipos: unicos(rota.tipo ? [rota.tipo, ...tiposQuery] : tiposQuery),
    cidade: rota.cidade,
    bairro: rota.bairro,
    construtoras: unicos(sp.getAll('construtora').filter((c) => /^[a-z0-9-]{1,80}$/.test(c))).slice(0, MAX_CONSTRUTORAS),
    quartos: inteiro(sp.get('quartos'), 4),
    banheiros: inteiro(sp.get('banheiros'), 3),
    vagas: inteiro(sp.get('vagas'), 3),
    mcmv: sp.get('mcmv') === '1',
    areaMin: numeroOuNulo(sp.get('area_min')),
    areaMax: numeroOuNulo(sp.get('area_max')),
    entrega: ENTREGAS.some((e) => e.valor === entrega) ? (entrega as Entrega) : null,
    q: (sp.get('q') ?? '').slice(0, 80),
    ordem: ORDENS.some((o) => o.valor === ordem) ? (ordem as Ordem) : 'recentes',
  }
  return { filtros, pagina: Math.max(1, inteiro(sp.get('pagina'), 500)) }
}

const mesmoConjunto = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** Separa o que vai no caminho (indexável) do que vai na query. */
export function rotaDosFiltros(f: Filtros): FiltrosRota {
  const lancamentos = f.categoria === 'venda' && mesmoConjunto(f.situacoes, SITUACOES_LANCAMENTO)
  return {
    categoria: f.categoria === 'aluguel' ? 'aluguel' : f.categoria === 'venda' ? (lancamentos ? 'lancamentos' : 'venda') : null,
    tipo: f.tipos.length === 1 ? f.tipos[0]! : null,
    cidade: f.cidade,
    bairro: f.cidade ? f.bairro : null,
  }
}

export function montarUrl(f: Filtros, pagina = 1) {
  const rota = rotaDosFiltros(f)
  const sp = new URLSearchParams()
  if (rota.categoria !== 'lancamentos') f.situacoes.forEach((s) => sp.append('situacao', s))
  if (!rota.tipo) f.tipos.forEach((t) => sp.append('tipo', t))
  f.construtoras.forEach((c) => sp.append('construtora', c))
  if (f.quartos) sp.set('quartos', String(f.quartos))
  if (f.banheiros) sp.set('banheiros', String(f.banheiros))
  if (f.vagas) sp.set('vagas', String(f.vagas))
  if (f.mcmv) sp.set('mcmv', '1')
  if (f.areaMin) sp.set('area_min', String(f.areaMin))
  if (f.areaMax) sp.set('area_max', String(f.areaMax))
  if (f.entrega) sp.set('entrega', f.entrega)
  if (f.q.trim()) sp.set('q', f.q.trim())
  if (f.ordem !== 'recentes') sp.set('ordem', f.ordem)
  if (pagina > 1) sp.set('pagina', String(pagina))
  const query = sp.toString()
  return caminhoDaRota(rota) + (query ? `?${query}` : '')
}

export interface ChipFiltro {
  chave: string
  rotulo: string
  /** Alteração a aplicar nos filtros para remover este chip. */
  remover: Partial<Filtros>
}

export function chipsAtivos(f: Filtros, cidades: Cidade[], construtoras: Construtora[]): ChipFiltro[] {
  const chips: ChipFiltro[] = []
  const cidade = cidades.find((c) => c.slug === f.cidade)
  if (f.categoria !== 'todos')
    chips.push({ chave: 'categoria', rotulo: f.categoria === 'venda' ? 'Venda' : 'Aluguel', remover: { categoria: 'todos' } })
  if (f.mcmv) chips.push({ chave: 'mcmv', rotulo: 'Minha Casa Minha Vida', remover: { mcmv: false } })
  if (cidade) chips.push({ chave: 'cidade', rotulo: cidade.nome, remover: { cidade: null, bairro: null } })
  const bairro = cidade?.bairros.find((b) => b.slug === f.bairro)
  if (bairro) chips.push({ chave: 'bairro', rotulo: bairro.nome, remover: { bairro: null } })
  f.construtoras.forEach((slug) => {
    const construtora = construtoras.find((c) => c.slug === slug)
    if (construtora)
      chips.push({ chave: `construtora-${slug}`, rotulo: construtora.nome, remover: { construtoras: f.construtoras.filter((x) => x !== slug) } })
  })
  f.situacoes.forEach((s) =>
    chips.push({ chave: `situacao-${s}`, rotulo: rotuloSituacao[s], remover: { situacoes: f.situacoes.filter((x) => x !== s) } })
  )
  f.tipos.forEach((t) =>
    chips.push({ chave: `tipo-${t}`, rotulo: rotuloTipo[t], remover: { tipos: f.tipos.filter((x) => x !== t) } })
  )
  if (f.quartos) chips.push({ chave: 'quartos', rotulo: `${f.quartos}+ quartos`, remover: { quartos: 0 } })
  if (f.banheiros) chips.push({ chave: 'banheiros', rotulo: `${f.banheiros}+ banheiros`, remover: { banheiros: 0 } })
  if (f.vagas) chips.push({ chave: 'vagas', rotulo: `${f.vagas}+ vagas`, remover: { vagas: 0 } })
  if (f.areaMin || f.areaMax) {
    const rotulo = f.areaMin && f.areaMax ? `${f.areaMin} a ${f.areaMax} m²` : f.areaMin ? `A partir de ${f.areaMin} m²` : `Até ${f.areaMax} m²`
    chips.push({ chave: 'area', rotulo, remover: { areaMin: null, areaMax: null } })
  }
  if (f.entrega) {
    const rotulo = ENTREGAS.find((e) => e.valor === f.entrega)!.rotulo
    chips.push({ chave: 'entrega', rotulo: f.entrega === 'pronto' ? rotulo : `Entrega ${rotulo.toLowerCase()}`, remover: { entrega: null } })
  }
  if (f.q.trim()) chips.push({ chave: 'q', rotulo: `“${f.q.trim()}”`, remover: { q: '' } })
  return chips
}

/** Mantém o estado coerente após uma alteração (ex.: aluguel não tem situação de obra). */
export function aplicarAlteracao(f: Filtros, alteracao: Partial<Filtros>): Filtros {
  const novo = { ...f, ...alteracao }
  if (novo.categoria === 'aluguel') {
    novo.situacoes = []
    novo.entrega = null
    novo.mcmv = false
  }
  if (!novo.cidade) novo.bairro = null
  return novo
}

export function limparFiltros(f: Filtros): Filtros {
  return { ...FILTROS_PADRAO, ordem: f.ordem }
}

/** Mesma busca, no endpoint JSON usado pelo "Carregar mais". */
export function montarUrlApi(f: Filtros, pagina: number) {
  const [caminho, query] = montarUrl(f, pagina).split('?')
  const sp = new URLSearchParams(query)
  sp.set('caminho', caminho!)
  return `/api/imoveis?${sp.toString()}`
}
