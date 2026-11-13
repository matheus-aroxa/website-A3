// Leituras do catálogo para o painel: inclui os desativados, sem cache
// (o painel sempre vê o estado atual do banco). A listagem é paginada no SQL (consultas-admin.ts).
import 'server-only'
import { obterRegistro, obterVitrine } from '@/lib/imoveis/banco'
import {
  idMaisRecente,
  idsAtivos,
  listarOpcoesVitrine,
  listarPaginaAdmin,
  obterVitrineEfetiva,
  type AbaAdmin,
  type FiltroAdmin,
  type LinhaAdmin,
} from '@/lib/imoveis/consultas-admin'
import { etiquetaImovel, formatarPreco, rotuloPreco } from '@/lib/imoveis/formato'
import { listarConstrutorasAdmin } from '@/lib/imoveis/construtoras'
import { porMaisRecente, temFoto } from '@/lib/imoveis/filtragem'
import { fonteDosImoveis } from '@/lib/imoveis/fonte'
import type { StatusImovel, Vitrine } from '@/lib/imoveis/painel'
import { LIMITE_DESTAQUES } from '@/lib/imoveis/repositorio'
import type { Imovel } from '@/lib/imoveis/tipos'
import { catalogo as catalogoDaViniun } from '@/lib/imoveis/viniun/consultas'
import { exigirAdmin } from './acesso'

export type { AbaAdmin, FiltroAdmin }

export interface ItemAdmin extends Omit<LinhaAdmin, 'capa'> {
  capa?: string
}

/** Imóvel publicado que pode entrar na vitrine, já com os textos das prévias. */
export interface OpcaoVitrine {
  id: string
  nome: string
  codigo: string
  bairro: string
  cidade: string
  etiqueta: string
  /** Sufixo da classe global `etiqueta-*`. */
  classeEtiqueta: string
  rotuloPreco: string
  preco: string
  /** Foto dos cards e do topo da home (a capa). */
  capa?: string
  /** Foto grande do topo da home (a capa). */
  foto?: string
}

export interface CatalogoAdmin {
  itens: ItemAdmin[]
  total: number
  /** O total separado entre publicados e desativados. */
  porStatus: Record<StatusImovel, number>
  pagina: number
  totalPaginas: number
  /** Quantos imóveis há em cada aba (sem considerar a busca). */
  contagens: Record<AbaAdmin, number>
}

/** Uma página do catálogo, já filtrada e contada pelo banco. */
export async function listarCatalogoAdmin(filtro: FiltroAdmin): Promise<CatalogoAdmin> {
  await exigirAdmin()
  const { itens, ...resto } = await listarPaginaAdmin(filtro)
  return { ...resto, itens: itens.map(({ capa, ...item }) => ({ ...item, ...(capa ? { capa } : {}) })) }
}

/** Construtoras para o painel (campo do formulário, filtro da lista e página de cadastro), com a contagem de imóveis. */
export async function listarConstrutorasDoPainel() {
  await exigirAdmin()
  return listarConstrutorasAdmin()
}

export async function obterImovelAdmin(id: string) {
  await exigirAdmin()
  return obterRegistro(id)
}

export async function obterVitrineAdmin() {
  await exigirAdmin()
  if (fonteDosImoveis() === 'viniun') return vitrineDaViniun()
  const [vitrine, linhas, semDestaques] = await Promise.all([obterVitrineEfetiva(), listarOpcoesVitrine(), idMaisRecente()])
  return {
    vitrine,
    semDestaques,
    opcoes: linhas.map(
      (l): OpcaoVitrine => ({
        id: l.id,
        nome: l.nome,
        codigo: l.codigo,
        bairro: l.bairro,
        cidade: l.cidade,
        etiqueta: etiquetaImovel(l),
        classeEtiqueta: l.finalidade === 'aluguel' ? 'aluguel' : l.situacao,
        rotuloPreco: rotuloPreco(l.finalidade),
        preco: formatarPreco(l.preco, l.finalidade),
        ...(l.capa ? { capa: l.capa, foto: l.capa } : {}),
      }),
    ),
  }
}

/** Quais destes ids podem entrar na vitrine: publicados no banco, ou (modo Viniun) publicados na Viniun com foto. */
export async function idsParaVitrine(ids: string[]): Promise<Set<string>> {
  if (fonteDosImoveis() === 'banco') return idsAtivos(ids)
  const publicados = new Set((await imoveisDaViniunComFoto()).map((im) => im.id))
  return new Set(ids.filter((id) => publicados.has(id)))
}

// ---------- Vitrine com o catálogo na Viniun ----------
// As escolhas ficam nas mesmas tabelas (vitrine_*), com o id do imóvel no site: o do banco para os que vieram de lá, ou
// "v<id da Viniun>" para os cadastrados direto na Viniun (db/vitrine-viniun.sql tira a chave estrangeira para imoveis).

const imoveisDaViniunComFoto = async () => (await catalogoDaViniun()).filter(temFoto)

/** A vitrine em vigor no modo Viniun, só com imóveis que estão no site (o que saiu da Viniun some sem precisar salvar). */
function vitrineEfetivaViniun({ personalizada, vitrine }: { personalizada: boolean; vitrine: Vitrine }, imoveis: Imovel[]): Vitrine {
  const ids = new Set(imoveis.map((im) => im.id))
  if (personalizada) {
    return { heroi: vitrine.heroi && ids.has(vitrine.heroi) ? vitrine.heroi : null, destaques: vitrine.destaques.filter((id) => ids.has(id)) }
  }
  const marcados = imoveis.filter((im) => im.destaque).sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))
  return { heroi: null, destaques: marcados.slice(0, LIMITE_DESTAQUES).map((im) => im.id) }
}

async function vitrineDaViniun() {
  const [imoveis, estado] = await Promise.all([imoveisDaViniunComFoto(), obterVitrine()])
  const ordenados = [...imoveis].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id))
  return {
    vitrine: vitrineEfetivaViniun(estado, imoveis),
    semDestaques: porMaisRecente(imoveis)[0]?.id ?? null,
    opcoes: ordenados.map((im): OpcaoVitrine => {
      const capa = (im.capa ?? im.fotos[0])?.src
      return {
        id: im.id,
        nome: im.nome,
        codigo: im.codigo,
        bairro: im.local.bairro,
        cidade: im.local.cidade,
        etiqueta: etiquetaImovel(im),
        classeEtiqueta: im.finalidade === 'aluguel' ? 'aluguel' : im.situacao,
        rotuloPreco: rotuloPreco(im.finalidade),
        preco: formatarPreco(im.preco, im.finalidade),
        ...(capa ? { capa, foto: capa } : {}),
      }
    }),
  }
}
