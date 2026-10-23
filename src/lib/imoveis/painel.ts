// Tipos e regras do painel administrativo sobre o catálogo (que fica no banco, src/lib/imoveis/banco.ts).
import type { Imovel } from './tipos'

/** Campos que o painel pode alterar. Id, código e slug (URL) seguem sempre o CRM. */
export const CAMPOS_EDITAVEIS = [
  'nome', 'chamada', 'tipo', 'finalidade', 'situacao', 'mcmv', 'preco', 'area', 'quartos', 'suites',
  'banheiros', 'vagas', 'entrega', 'unidades', 'construtora', 'local', 'descricao', 'lazer',
  'proximidades', 'fotos',
] as const satisfies readonly (keyof Imovel)[]

export type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number]

export type StatusImovel = 'ativo' | 'inativo' | 'excluido'

export interface Vitrine {
  /** Imóvel do topo da home. `null`: nenhum escolhido (vale o destaque mais recente). */
  heroi: string | null
  /** Imóveis em destaque na home, na ordem de exibição. */
  destaques: string[]
}

/** Prefixo do id e do código dos imóveis cadastrados no painel. */
export const PREFIXO_CRIADO = 'A3-'

/** JSON com as chaves em ordem fixa: o jsonb do banco não preserva a ordem em que o objeto foi escrito. */
function estavel(valor: unknown): string {
  return JSON.stringify(valor ?? null, (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )
}

/** Src da foto dos cards: a capa escolhida ou, sem escolha, a primeira da galeria. */
export const capaDe = (im: Pick<Imovel, 'fotos' | 'capa'>) => (im.capa ?? im.fotos[0])?.src

/** Nomes dos campos de `novo` que diferem de `original`. */
export function diferencas(original: Imovel, novo: Pick<Imovel, CampoEditavel>): CampoEditavel[] {
  return CAMPOS_EDITAVEIS.filter((campo) => estavel(original[campo]) !== estavel(novo[campo]))
}
