// Leituras do catálogo para o painel: inclui os desativados, sem cache
// (o painel sempre vê o estado atual do banco). A listagem é paginada no SQL (consultas-admin.ts).
import 'server-only'
import { obterRegistro } from '@/lib/imoveis/banco'
import {
  listarOpcoesVitrine,
  listarPaginaAdmin,
  obterVitrineEfetiva,
  type AbaAdmin,
  type FiltroAdmin,
  type LinhaAdmin,
} from '@/lib/imoveis/consultas-admin'
import { etiquetaImovel, formatarPreco, rotuloPreco } from '@/lib/imoveis/formato'
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

export async function obterImovelAdmin(id: string) {
  await exigirAdmin()
  return obterRegistro(id)
}

export async function obterVitrineAdmin() {
  await exigirAdmin()
  const [vitrine, linhas] = await Promise.all([obterVitrineEfetiva(), listarOpcoesVitrine()])
  return {
    vitrine,
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
