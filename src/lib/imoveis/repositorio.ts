// Consultas ao catálogo, com cache do Next.js ("use cache"). Tudo o que as páginas leem
// passa por aqui, então o CRM é consultado no máximo uma vez por janela de cache.
// Para atualizar na hora após uma mudança no CRM: POST /api/revalidar (tag "imoveis").
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { crm } from '@/lib/crm'
import { atendeFiltros, extrairCidades, ordenar, resumir } from './busca'
import { POR_PAGINA, lerFiltros, type Filtros, type FiltrosRota } from './filtros'
import type { Cidade, Imovel, ImovelResumo } from './tipos'

export const TAG_IMOVEIS = 'imoveis'

export async function listarImoveis(): Promise<Imovel[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return crm.listarImoveis()
}

export async function obterImovelPorSlug(slug: string): Promise<Imovel | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const imoveis = await listarImoveis()
  return imoveis.find((im) => im.slug === slug) ?? null
}

export async function listarDestaques(): Promise<ImovelResumo[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const imoveis = await listarImoveis()
  return ordenar(imoveis.filter((im) => im.destaque), 'recentes').slice(0, 3).map(resumir)
}

export async function listarCidades(): Promise<Cidade[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return extrairCidades(await listarImoveis())
}

export interface ResultadoBusca {
  itens: ImovelResumo[]
  total: number
  pagina: number
  totalPaginas: number
}

export async function buscarImoveis(filtros: Filtros, pagina: number): Promise<ResultadoBusca> {
  'use cache'
  cacheLife('minutes')
  cacheTag(TAG_IMOVEIS)
  const imoveis = await listarImoveis()
  const encontrados = ordenar(imoveis.filter((im) => atendeFiltros(im, filtros)), filtros.ordem)
  const totalPaginas = Math.max(1, Math.ceil(encontrados.length / POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  return {
    itens: encontrados.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA).map(resumir),
    total: encontrados.length,
    pagina: atual,
    totalPaginas,
  }
}

/** Quantos imóveis existem numa página de busca "limpa" (só os filtros do caminho). */
export async function contarPorRota(rota: FiltrosRota): Promise<number> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const { filtros } = lerFiltros(rota, {})
  const imoveis = await listarImoveis()
  return imoveis.filter((im) => atendeFiltros(im, filtros)).length
}

export async function listarSemelhantes(imovel: Imovel): Promise<ImovelResumo[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const imoveis = await listarImoveis()
  const candidatos = imoveis.filter(
    (im) => im.id !== imovel.id && im.finalidade === imovel.finalidade && im.local.cidadeSlug === imovel.local.cidadeSlug
  )
  // Mesma situação de obra primeiro, depois os mais recentes.
  const pontuar = (im: Imovel) => (im.situacao === imovel.situacao ? 1 : 0)
  return ordenar(candidatos, 'recentes')
    .sort((a, b) => pontuar(b) - pontuar(a))
    .slice(0, 3)
    .map(resumir)
}

/** Imóvel do topo da home: o marcado como "herói" ou, na falta, o destaque mais recente. */
export async function obterImovelHeroi(): Promise<Imovel | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const imoveis = ordenar(await listarImoveis(), 'recentes')
  return imoveis.find((im) => im.heroi) ?? imoveis.find((im) => im.destaque) ?? imoveis[0] ?? null
}
