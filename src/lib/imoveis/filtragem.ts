// As mesmas regras da busca em SQL (consultas.ts), aplicadas a uma lista de imóveis já carregada em memória.
// Usado quando o catálogo vem da Viniun (viniun/consultas.ts): a API deles não tem todos os filtros e a ordenação do site.
import { POR_PAGINA, type Entrega, type Filtros, type Ordem } from './filtros'
import { nomeDoLocal, normalizarBusca } from './formato'
import type { PaginaResumos } from './consultas'
import type { IndiceImovel } from './rotas'
import { SLUG_CONSTRUTORA_PADRAO, type Cidade, type Construtora, type Imovel, type ImovelResumo } from './tipos'

/** Último mês de cada opção de entrega ("até dez/2027"). */
export const FIM_DO_ANO: Record<Exclude<Entrega, 'pronto'>, string> = { '2026': '2026-12', '2027': '2027-12', '2028': '2028-12' }

/** Só aparece na busca o imóvel com ao menos uma foto (a capa vem dela). */
export const temFoto = (im: Imovel) => im.fotos.length > 0

export function atendeFiltros(im: Imovel, f: Filtros): boolean {
  if (f.categoria !== 'todos' && im.finalidade !== f.categoria) return false
  if (f.situacoes.length && !f.situacoes.includes(im.situacao)) return false
  if (f.tipos.length && !f.tipos.includes(im.tipo)) return false
  if (f.cidade && im.local.cidadeSlug !== f.cidade) return false
  if (f.bairro && im.local.bairroSlug !== f.bairro) return false
  if (f.construtoras.length && !f.construtoras.includes(im.construtora.slug)) return false
  if (f.quartos && im.quartos.max < f.quartos) return false
  if (f.banheiros && im.banheiros.max < f.banheiros) return false
  if (f.vagas && (im.vagas?.max ?? 0) < f.vagas) return false
  if (f.mcmv && !im.mcmv) return false
  if (f.areaMin && im.area.max < f.areaMin) return false
  if (f.areaMax && im.area.min > f.areaMax) return false
  if (f.entrega === 'pronto' && im.situacao !== 'pronto') return false
  if (f.entrega && f.entrega !== 'pronto' && im.situacao !== 'pronto' && !(im.entrega && im.entrega <= FIM_DO_ANO[f.entrega])) return false
  if (f.q.trim()) {
    const alvo = normalizarBusca(`${im.nome} ${im.codigo}`)
    if (!normalizarBusca(f.q).split(/\s+/).every((termo) => alvo.includes(termo))) return false
  }
  return true
}

const desempate = (a: Imovel, b: Imovel) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
const maisRecente = (a: Imovel, b: Imovel) => b.publicadoEm.localeCompare(a.publicadoEm)

const COMPARAR: Record<Ordem, (a: Imovel, b: Imovel) => number> = {
  recentes: maisRecente,
  'menor-preco': (a, b) => a.preco - b.preco,
  'maior-preco': (a, b) => b.preco - a.preco,
  'maior-area': (a, b) => b.area.max - a.area.max,
  'mais-quartos': (a, b) => b.quartos.max - a.quartos.max,
}

export const ordenar = (lista: Imovel[], ordem: Ordem) => [...lista].sort((a, b) => COMPARAR[ordem](a, b) || desempate(a, b))

/** Os mais recentes primeiro (mesma ordem de "recentes" na busca). */
export const porMaisRecente = (lista: Imovel[]) => ordenar(lista, 'recentes')

export function paraResumo(im: Imovel): ImovelResumo {
  return {
    id: im.id,
    codigo: im.codigo,
    slug: im.slug,
    nome: im.nome,
    tipo: im.tipo,
    finalidade: im.finalidade,
    situacao: im.situacao,
    local: { bairro: im.local.bairro, cidade: im.local.cidade },
    preco: im.preco,
    area: im.area,
    quartos: im.quartos,
    banheiros: im.banheiros,
    vagas: im.vagas,
    entrega: im.entrega,
    capa: (im.capa ?? im.fotos[0])!,
  }
}

export function paginar(lista: Imovel[], f: Filtros, pagina: number, porPagina = POR_PAGINA): PaginaResumos {
  const achados = ordenar(lista.filter((im) => temFoto(im) && atendeFiltros(im, f)), f.ordem)
  const totalPaginas = Math.max(1, Math.ceil(achados.length / porPagina))
  const atual = Math.min(pagina, totalPaginas)
  const itens = achados.slice((atual - 1) * porPagina, atual * porPagina).map(paraResumo)
  return { itens, total: achados.length, pagina: atual, totalPaginas }
}

const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, 'pt-BR')

/** Cidades e bairros dos imóveis, em ordem alfabética. */
export function agruparCidades(lista: Pick<Imovel, 'local'>[]): Cidade[] {
  const mapa = new Map<string, Cidade>()
  for (const { local } of lista) {
    const cidade = mapa.get(local.cidadeSlug) ?? { nome: local.cidade, slug: local.cidadeSlug, uf: local.uf, bairros: [] }
    if (!cidade.bairros.some((b) => b.slug === local.bairroSlug)) cidade.bairros.push({ nome: nomeDoLocal(local.bairro), slug: local.bairroSlug })
    mapa.set(local.cidadeSlug, cidade)
  }
  return [...mapa.values()].map((c) => ({ ...c, bairros: c.bairros.sort(porNome) })).sort(porNome)
}

/** Construtoras dos imóveis, em ordem alfabética, com a padrão ("Não informado") por último. */
export function agruparConstrutoras(lista: Imovel[]): Construtora[] {
  const mapa = new Map(lista.map((im) => [im.construtora.slug, im.construtora]))
  return [...mapa.values()].sort(
    (a, b) => Number(a.slug === SLUG_CONSTRUTORA_PADRAO) - Number(b.slug === SLUG_CONSTRUTORA_PADRAO) || porNome(a, b),
  )
}

export function paraIndice(im: Imovel, comFotos: boolean): IndiceImovel {
  return {
    slug: im.slug,
    finalidade: im.finalidade,
    situacao: im.situacao,
    tipo: im.tipo,
    atualizadoEm: im.atualizadoEm,
    preco: im.preco,
    mcmv: im.mcmv,
    quartos: im.quartos,
    area: im.area,
    local: { cidadeSlug: im.local.cidadeSlug, bairroSlug: im.local.bairroSlug },
    ...(comFotos ? { fotos: im.fotos.map((f) => f.src) } : {}),
  }
}
