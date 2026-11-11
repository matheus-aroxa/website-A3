// As consultas do site (mesmas assinaturas de consultas.ts) quando o catálogo vem da Viniun.
// O catálogo inteiro fica num cache remoto, compartilhado por todas as instâncias (a API da Viniun tem limite de
// chamadas). Ele expira a cada hora e é invalidado pela tag do catálogo (webhook /api/viniun ou POST /api/revalidar).
// Cada atualização só baixa da Viniun as fichas alteradas (fichas.ts).
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { PaginaResumos } from '../consultas'
import { agruparCidades, agruparConstrutoras, paginar, paraIndice, paraResumo, porMaisRecente, temFoto } from '../filtragem'
import type { Filtros } from '../filtros'
import { TAG_IMOVEIS } from '../fonte'
import type { IndiceImovel } from '../rotas'
import type { Cidade, Construtora, Imovel, ImovelResumo } from '../tipos'
import { baixarCatalogo } from './carga'

async function catalogo(): Promise<Imovel[]> {
  'use cache: remote'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return baixarCatalogo()
}

export async function contarImoveis(f: Filtros): Promise<number> {
  return (await buscarPagina(f, 1)).total
}

export async function buscarPagina(f: Filtros, pagina: number): Promise<PaginaResumos> {
  return paginar(await catalogo(), f, pagina)
}

/** Os destaques são os imóveis marcados como destaque na Viniun, do mais recente para o mais antigo. */
export async function buscarDestaques(limite: number): Promise<ImovelResumo[]> {
  return porMaisRecente((await catalogo()).filter((im) => im.destaque && temFoto(im)))
    .slice(0, limite)
    .map(paraResumo)
}

/** Topo da home: a Viniun não tem "herói"; vale o destaque mais recente (ou, sem destaque, o imóvel mais recente). */
export async function buscarHeroi(): Promise<Imovel | null> {
  const lista = porMaisRecente((await catalogo()).filter(temFoto))
  return lista.find((im) => im.destaque) ?? lista[0] ?? null
}

/** Mesma finalidade e cidade; mesma situação de obra primeiro, depois os mais recentes. */
export async function buscarSemelhantes(imovel: Imovel, limite: number): Promise<ImovelResumo[]> {
  const candidatos = (await catalogo()).filter(
    (im) => im.id !== imovel.id && im.finalidade === imovel.finalidade && im.local.cidadeSlug === imovel.local.cidadeSlug && temFoto(im),
  )
  return porMaisRecente(candidatos)
    .sort((a, b) => Number(b.situacao === imovel.situacao) - Number(a.situacao === imovel.situacao))
    .slice(0, limite)
    .map(paraResumo)
}

export async function buscarAtivoPorSlug(slug: string): Promise<Imovel | null> {
  return (await catalogo()).find((im) => im.slug === slug) ?? null
}

export async function buscarAtivoPorId(id: string): Promise<Imovel | null> {
  return (await catalogo()).find((im) => im.id === id) ?? null
}

export async function buscarCidades(): Promise<Cidade[]> {
  return agruparCidades(await catalogo())
}

export async function buscarConstrutoras(): Promise<Construtora[]> {
  return agruparConstrutoras(await catalogo())
}

export async function buscarIndice(comFotos = false): Promise<IndiceImovel[]> {
  return (await catalogo()).map((im) => paraIndice(im, comFotos))
}
