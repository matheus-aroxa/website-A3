// As consultas do site (mesmas assinaturas de consultas.ts) quando o catálogo vem da Viniun.
// O catálogo inteiro fica num cache remoto, compartilhado por todas as instâncias (a API da Viniun tem limite de
// chamadas). Ele expira a cada hora e é invalidado pela tag do catálogo (webhook /api/viniun ou POST /api/revalidar).
// Cada atualização só baixa da Viniun as fichas alteradas (fichas.ts).
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { PaginaResumos } from '../consultas'
import { agruparCidades, agruparConstrutoras, paginar, paraIndice, paraResumo, porMaisRecente, temFoto } from '../filtragem'
import { POR_PAGINA, type Filtros } from '../filtros'
import { TAG_IMOVEIS } from '../fonte'
import type { IndiceImovel } from '../rotas'
import { obterVitrine } from '../banco'
import type { Cidade, Construtora, Imovel, ImovelResumo } from '../tipos'
import { baixarCatalogo } from './carga'

/** Todos os imóveis publicados no site (inclusive os sem foto, que não aparecem na busca). */
export async function catalogo(): Promise<Imovel[]> {
  'use cache: remote'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  return baixarCatalogo()
}

export async function contarImoveis(f: Filtros): Promise<number> {
  return (await buscarPagina(f, 1)).total
}

export async function buscarPagina(f: Filtros, pagina: number, porPagina = POR_PAGINA): Promise<PaginaResumos> {
  return paginar(await catalogo(), f, pagina, porPagina)
}

/**
 * Destaques da home: os escolhidos na vitrine do painel, na ordem de lá. Enquanto a vitrine nunca foi salva, os marcados
 * como "Destaque" na Viniun, do mais recente para o mais antigo. Imóvel que saiu do site ou está sem foto é pulado.
 */
export async function buscarDestaques(limite: number): Promise<ImovelResumo[]> {
  return (await destaquesEfetivos()).slice(0, limite).map(paraResumo)
}

/**
 * Topo da home: o escolhido no painel; sem escolha, o primeiro destaque (ou, sem destaque, o imóvel mais recente).
 * Atenção: a data de publicação da Viniun é a do lote "Publicar no site" de 11/11/2026, então "mais recente" ali é só a
 * ordem em que o lote foi processado.
 */
export async function buscarHeroi(): Promise<Imovel | null> {
  const [lista, { personalizada, vitrine }] = await Promise.all([catalogo(), obterVitrine()])
  const escolhido = personalizada && vitrine.heroi ? lista.find((im) => im.id === vitrine.heroi && temFoto(im)) : undefined
  return escolhido ?? (await destaquesEfetivos())[0] ?? porMaisRecente(lista.filter(temFoto))[0] ?? null
}

async function destaquesEfetivos(): Promise<Imovel[]> {
  const [lista, { personalizada, vitrine }] = await Promise.all([catalogo(), obterVitrine()])
  if (!personalizada) return porMaisRecente(lista.filter((im) => im.destaque && temFoto(im)))
  const porId = new Map(lista.map((im) => [im.id, im]))
  return vitrine.destaques.flatMap((id) => {
    const im = porId.get(id)
    return im && temFoto(im) ? [im] : []
  })
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
