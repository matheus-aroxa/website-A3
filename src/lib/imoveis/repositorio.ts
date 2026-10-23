// Consultas ao catálogo, com cache do Next.js ("use cache"). Tudo o que as páginas leem
// passa por aqui, então o banco é consultado no máximo uma vez por janela de cache.
// Cada função traz só o que a página usa (uma página de busca, um imóvel, os destaques...): o catálogo
// inteiro nunca é carregado. Os filtros e a paginação rodam no SQL (consultas.ts).
// Para atualizar na hora após uma mudança no catálogo: POST /api/revalidar (tag "imoveis").
// O painel administrativo invalida a mesma tag ao salvar.
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import {
  buscarAtivoPorId,
  buscarAtivoPorSlug,
  buscarCidades,
  buscarDestaques,
  buscarHeroi,
  buscarIndice,
  buscarPagina,
  buscarSemelhantes,
  contarImoveis,
  type PaginaResumos,
} from './consultas'
import { lerFiltros, type Filtros, type FiltrosRota } from './filtros'
import type { IndiceImovel } from './rotas'
import type { Cidade, Imovel, ImovelResumo } from './tipos'

export const TAG_IMOVEIS = 'imoveis'

/** Quantos destaques a home exibe. */
export const LIMITE_DESTAQUES = 3

/** Imóvel publicado (sem desativados e excluídos), com galeria e textos completos. */
export async function obterImovelPorSlug(slug: string): Promise<Imovel | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarAtivoPorSlug(slug)
}

/** Sem cache: usado ao receber um formulário, que precisa do estado atual. */
export const obterImovelPorId = buscarAtivoPorId

/** O mínimo de cada imóvel publicado (para gerar rotas): sem descrição nem galeria. */
export async function listarIndice(): Promise<IndiceImovel[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarIndice()
}

/** Igual ao índice, mais o endereço das fotos (sitemap). */
export async function listarIndiceComFotos(): Promise<IndiceImovel[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarIndice(true)
}

export async function listarDestaques(): Promise<ImovelResumo[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarDestaques(LIMITE_DESTAQUES)
}

export async function listarCidades(): Promise<Cidade[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarCidades()
}

export type ResultadoBusca = PaginaResumos

export async function buscarImoveis(filtros: Filtros, pagina: number): Promise<ResultadoBusca> {
  'use cache'
  cacheLife('minutes')
  cacheTag(TAG_IMOVEIS)
  return buscarPagina(filtros, pagina)
}

/** Quantos imóveis existem numa página de busca "limpa" (só os filtros do caminho). */
export async function contarPorRota(rota: FiltrosRota): Promise<number> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const { filtros } = lerFiltros(rota, {})
  return contarImoveis(filtros)
}

export async function listarSemelhantes(imovel: Imovel): Promise<ImovelResumo[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarSemelhantes(imovel, 3)
}

/** Imóvel do topo da home: o marcado como "herói" ou, na falta, o destaque mais recente. */
export async function obterImovelHeroi(): Promise<Imovel | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return buscarHeroi()
}
