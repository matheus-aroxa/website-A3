// Leituras do catálogo para o painel: inclui inativos e excluídos, sem cache
// (o painel sempre vê o estado atual do arquivo de ajustes).
import 'server-only'
import { crm } from '@/lib/crm'
import { aplicarAjustes, lerAjustes, statusDe, type StatusImovel, type Vitrine } from '@/lib/imoveis/ajustes'
import { ordenar } from '@/lib/imoveis/busca'
import { LIMITE_DESTAQUES } from '@/lib/imoveis/repositorio'
import { etiquetaImovel, formatarPreco, rotuloPreco } from '@/lib/imoveis/formato'
import type { Finalidade, Imovel, Situacao } from '@/lib/imoveis/tipos'
import { exigirAdmin } from './acesso'

export interface ItemAdmin {
  id: string
  codigo: string
  slug: string
  nome: string
  bairro: string
  cidade: string
  preco: number
  finalidade: Finalidade
  situacao: Situacao
  capa?: string
  status: StatusImovel
  editado: boolean
  heroi: boolean
  destaque: boolean
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
  /** Foto dos cards. */
  capa?: string
  /** Foto grande do topo da home (a primeira da galeria). */
  foto?: string
}

/** Vitrine em vigor: a do painel ou, se ninguém mexeu nela, a que veio do CRM. */
function vitrineEfetiva(ativos: Imovel[], vitrine: Vitrine | undefined): Vitrine {
  if (vitrine) return vitrine
  const recentes = ordenar(ativos, 'recentes')
  return {
    heroi: recentes.find((im) => im.heroi)?.id ?? null,
    // Mesma regra da home: os mais recentes marcados no CRM, até o limite.
    destaques: recentes.filter((im) => im.destaque).slice(0, LIMITE_DESTAQUES).map((im) => im.id),
  }
}

async function carregar() {
  const [base, ajustes] = await Promise.all([crm.listarImoveis(), lerAjustes()])
  const imoveis = base.map((original) => ({
    original,
    imovel: aplicarAjustes(original, ajustes),
    status: statusDe(original.id, ajustes),
    editado: Object.keys(ajustes.editados[original.id] ?? {}).length > 0,
  }))
  const ativos = imoveis.filter((i) => i.status === 'ativo').map((i) => i.imovel)
  return { imoveis, ajustes, vitrine: vitrineEfetiva(ativos, ajustes.vitrine) }
}

/** Quem mexeu por último no painel e quando (para o topo da lista). */
export interface UltimaAlteracao {
  em: string
  por: string
}

export async function listarCatalogoAdmin(): Promise<{ itens: ItemAdmin[]; alteracao: UltimaAlteracao | null }> {
  await exigirAdmin()
  const { imoveis, ajustes, vitrine } = await carregar()
  const itens = imoveis
    .map(({ imovel: im, status, editado }) => ({
      id: im.id,
      codigo: im.codigo,
      slug: im.slug,
      nome: im.nome,
      bairro: im.local.bairro,
      cidade: im.local.cidade,
      preco: im.preco,
      finalidade: im.finalidade,
      situacao: im.situacao,
      capa: (im.capa ?? im.fotos[0])?.src,
      status,
      editado,
      heroi: status === 'ativo' && vitrine.heroi === im.id,
      destaque: status === 'ativo' && vitrine.destaques.includes(im.id),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const alteracao = ajustes.atualizadoEm ? { em: ajustes.atualizadoEm, por: ajustes.atualizadoPor ?? '' } : null
  return { itens, alteracao }
}

export async function obterImovelAdmin(id: string) {
  await exigirAdmin()
  const { imoveis } = await carregar()
  return imoveis.find((i) => i.original.id === id) ?? null
}

/** Original do CRM, para as Server Actions calcularem o que mudou. */
export async function obterOriginal(id: string): Promise<Imovel | null> {
  return (await crm.listarImoveis()).find((im) => im.id === id) ?? null
}

export async function obterVitrineAdmin() {
  await exigirAdmin()
  const { imoveis, ajustes, vitrine } = await carregar()
  const ativos = imoveis.filter((i) => i.status === 'ativo')
  const ativo = (id: string) => ativos.some((i) => i.imovel.id === id)
  return {
    vitrine: {
      heroi: vitrine.heroi && ativo(vitrine.heroi) ? vitrine.heroi : null,
      destaques: vitrine.destaques.filter(ativo),
    },
    personalizada: Boolean(ajustes.vitrine),
    opcoes: ativos
      .map(({ imovel: im }): OpcaoVitrine => ({
        id: im.id,
        nome: im.nome,
        codigo: im.codigo,
        bairro: im.local.bairro,
        cidade: im.local.cidade,
        etiqueta: etiquetaImovel(im),
        classeEtiqueta: im.finalidade === 'aluguel' ? 'aluguel' : im.situacao,
        rotuloPreco: rotuloPreco(im.finalidade),
        preco: formatarPreco(im.preco, im.finalidade),
        capa: (im.capa ?? im.fotos[0])?.src,
        foto: im.fotos[0]?.src,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  }
}
