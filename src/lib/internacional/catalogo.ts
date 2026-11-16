// Leituras do catálogo para a área internacional: os imóveis do recorte (recorte.ts), com os textos no idioma.
// Mesmo cache do resto do site (tag do catálogo): qualquer mudança no painel, na Viniun ou um POST /api/revalidar
// atualiza também estas páginas.
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { fotosComCapaPrimeiro } from '@/lib/imoveis/busca'
import { buscarPagina } from '@/lib/imoveis/consultas-site'
import { FILTROS_PADRAO } from '@/lib/imoveis/filtros'
import { TAG_IMOVEIS, TAG_VITRINE } from '@/lib/imoveis/fonte'
import { obterVitrineInternacional } from '@/lib/imoveis/banco'
import { LIMITE_DESTAQUES, listarDestaques, listarIndice, obterImovelPorSlug } from '@/lib/imoveis/repositorio'
import type { Foto, Imovel, ImovelResumo } from '@/lib/imoveis/tipos'
import { formatarQuartos } from './formato'
import { ehRevisado, type Idioma } from './idiomas'
import { traduzirItemLazer } from './lazer'
import { noRecorteInternacional } from './recorte'
import { dicionario } from './textos'
import { traduzirTextos } from './traducao'

export interface ResumoInternacional extends ImovelResumo {
  cidadeSlug: string
}

/** Todos os imóveis do recorte, do mais recente para o mais antigo. */
export async function listarImoveisInternacionais(): Promise<ResumoInternacional[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const [{ itens }, indice] = await Promise.all([
    buscarPagina({ ...FILTROS_PADRAO, categoria: 'venda', ordem: 'recentes' }, 1, 100_000),
    listarIndice(),
  ])
  const porSlug = new Map(indice.map((im) => [im.slug, im]))
  return itens.flatMap((im) => {
    const dados = porSlug.get(im.slug)
    return dados && noRecorteInternacional(dados) ? [{ ...im, cidadeSlug: dados.local.cidadeSlug }] : []
  })
}

/** Quantos destaques a página inicial internacional mostra no máximo (o mesmo limite da home em português). */
const LIMITE_DESTAQUES_INTERNACIONAIS = LIMITE_DESTAQUES

/** Seleção automática, para o idioma que nunca teve a vitrine configurada no painel. */
async function vitrineAutomatica(todos: ResumoInternacional[]) {
  const destaques = await listarDestaques()
  const porSlug = new Map(todos.map((im) => [im.slug, im]))
  const escolhidos = destaques.flatMap((d) => porSlug.get(d.slug) ?? [])
  const resto = todos.filter((im) => !escolhidos.includes(im))
  return [...escolhidos, ...resto].slice(0, LIMITE_DESTAQUES_INTERNACIONAIS)
}

export interface VitrineInternacional {
  /** Imóvel do topo da página inicial do idioma. */
  heroi?: ResumoInternacional
  destaques: ResumoInternacional[]
  /** Se a vitrine foi escolhida no painel (falso: seleção automática). */
  personalizada: boolean
}

/**
 * Vitrine da página inicial de cada idioma: a escolhida no painel (/admin/vitrine, aba do idioma) ou, se o idioma nunca foi
 * configurado, a seleção automática (os destaques da home em português que estão no recorte, completados com os mais
 * recentes). Só entram imóveis do recorte que estão no site; o que saiu some sozinho. Sem imóvel do topo escolhido (ou se
 * ele saiu do site), o topo é o primeiro destaque.
 */
export async function vitrineInternacional(idioma: Idioma): Promise<VitrineInternacional> {
  'use cache'
  // Os idiomas automáticos não têm vitrine própria no painel: usam a do inglês.
  if (!ehRevisado(idioma)) return vitrineInternacional('en')
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS, TAG_VITRINE)
  const [todos, escolhida] = await Promise.all([listarImoveisInternacionais(), obterVitrineInternacional(idioma)])
  if (!escolhida) {
    const destaques = await vitrineAutomatica(todos)
    return { heroi: destaques[0], destaques, personalizada: false }
  }
  const porId = new Map(todos.map((im) => [im.id, im]))
  const destaques = escolhida.destaques.flatMap((id) => porId.get(id) ?? [])
  const heroi = (escolhida.heroi ? porId.get(escolhida.heroi) : undefined) ?? destaques[0] ?? todos[0]
  return { heroi, destaques, personalizada: true }
}

export interface ImovelInternacional extends Imovel {
  /** A descrição saiu no original em português (sem tradução disponível): a página avisa. */
  descricaoOriginal: boolean
}

/** Ficha do imóvel no idioma, ou `null` se ele não existe, saiu do site ou está fora do recorte. */
export async function obterImovelInternacional(slug: string, idioma: Idioma): Promise<ImovelInternacional | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(TAG_IMOVEIS)
  const im = await obterImovelPorSlug(slug)
  if (!im || !noRecorteInternacional(im)) return null
  return traduzirImovel(im, idioma)
}

async function traduzirImovel(im: Imovel, idioma: Idioma): Promise<ImovelInternacional> {
  const d = await dicionario(idioma)
  const lazerPronto = im.lazer.map((item) => traduzirItemLazer(item, idioma))
  const proximidadesProntas = im.proximidades.map((item) => traduzirItemLazer(item, idioma))
  const legendas = [...im.fotos, ...(im.capa ? [im.capa] : [])].flatMap((f) => (f.legenda ? [f.legenda] : []))
  const t = await traduzirTextos(
    [
      ...im.descricao,
      ...im.lazer.filter((_, i) => !lazerPronto[i]),
      ...im.proximidades.filter((_, i) => !proximidadesProntas[i]),
      ...im.plantas.flatMap((p) => [p.titulo, p.descricao]),
      ...legendas,
    ],
    idioma,
  )

  const { nome, tipo } = im
  const { bairro, cidade, uf } = im.local
  const foto = (f: Foto, posicao: number): Foto => ({
    ...f,
    alt: d.imovel.altFoto({ nome, tipo, bairro, cidade, posicao }),
    legenda: f.legenda && t.traduzir(f.legenda),
  })
  return {
    ...im,
    chamada: d.imovel.chamada({ tipo, quartos: tipo === 'terreno' ? null : formatarQuartos(im.quartos, d), bairro, cidade, uf }),
    descricao: im.descricao.map(t.traduzir),
    descricaoOriginal: im.descricao.some((p) => !t.traduzido(p)),
    lazer: im.lazer.map((item, i) => lazerPronto[i] ?? t.traduzir(item)),
    proximidades: im.proximidades.map((item, i) => proximidadesProntas[i] ?? t.traduzir(item)),
    plantas: im.plantas.map((p) => ({
      ...p,
      titulo: t.traduzir(p.titulo),
      descricao: t.traduzir(p.descricao),
      foto: { ...p.foto, alt: `${nome} – ${t.traduzir(p.titulo)}` },
    })),
    fotos: im.fotos.map(foto),
    capa: im.capa && foto(im.capa, 0),
  }
}

/** Fotos na ordem da galeria (capa primeiro), como no site em português. */
export const fotosDoImovel = (im: ImovelInternacional) => fotosComCapaPrimeiro(im)
