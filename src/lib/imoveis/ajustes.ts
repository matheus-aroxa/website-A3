// Ajustes feitos no painel administrativo por cima do catálogo do CRM.
// O site não tem banco de dados: os ajustes ficam num arquivo JSON no servidor
// (ADMIN_DADOS_DIR, padrão ./dados), separado do catálogo. Assim, regenerar o
// catálogo a partir do CRM não apaga edições, desativações nem exclusões.
import 'server-only'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Imovel } from './tipos'

/** Campos que o painel pode sobrescrever. Id, código e slug (URL) seguem sempre o CRM. */
export const CAMPOS_EDITAVEIS = [
  'nome', 'chamada', 'tipo', 'finalidade', 'situacao', 'mcmv', 'preco', 'area', 'quartos', 'suites',
  'banheiros', 'vagas', 'entrega', 'unidades', 'construtora', 'local', 'descricao', 'lazer',
  'proximidades', 'fotos',
] as const satisfies readonly (keyof Imovel)[]

export type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number]
/** `null` marca um campo opcional que o painel apagou (ex.: construtora removida). */
export type Edicao = { [C in CampoEditavel]?: Imovel[C] | null }

export interface Vitrine {
  /** Imóvel do topo da home. `null`: nenhum escolhido (vale o destaque mais recente). */
  heroi: string | null
  /** Imóveis em destaque na home, na ordem de exibição. */
  destaques: string[]
}

export interface Ajustes {
  /** Só os campos alterados; os demais continuam acompanhando o CRM. */
  editados: Record<string, Edicao>
  inativos: string[]
  excluidos: string[]
  /** Ausente enquanto ninguém mexeu na vitrine: valem as marcações do CRM. */
  vitrine?: Vitrine
  atualizadoEm?: string
  atualizadoPor?: string
}

export type StatusImovel = 'ativo' | 'inativo' | 'excluido'

const VAZIO: Ajustes = { editados: {}, inativos: [], excluidos: [] }

/** Pasta dos dados do painel (ajustes e fotos enviadas). */
export const pastaDados = () => process.env.ADMIN_DADOS_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'dados')

const arquivo = () => path.join(pastaDados(), 'ajustes-catalogo.json')

export async function lerAjustes(): Promise<Ajustes> {
  try {
    const dados = JSON.parse(await readFile(arquivo(), 'utf8')) as Partial<Ajustes>
    return { ...VAZIO, ...dados }
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return VAZIO
    throw erro
  }
}

// Gravações em fila: duas ações simultâneas não se sobrescrevem (um único processo Node).
let fila: Promise<unknown> = Promise.resolve()

/** Lê, altera e grava os ajustes de forma atômica (arquivo temporário + rename). */
export function alterarAjustes(autor: string, alterar: (ajustes: Ajustes) => void): Promise<Ajustes> {
  const tarefa = fila.then(async () => {
    const ajustes = structuredClone(await lerAjustes())
    alterar(ajustes)
    ajustes.atualizadoEm = new Date().toISOString()
    ajustes.atualizadoPor = autor
    const destino = arquivo()
    await mkdir(path.dirname(destino), { recursive: true })
    const temporario = `${destino}.${process.pid}.tmp`
    await writeFile(temporario, JSON.stringify(ajustes, null, 2))
    await rename(temporario, destino)
    return ajustes
  })
  fila = tarefa.catch(() => {})
  return tarefa
}

export function statusDe(id: string, ajustes: Ajustes): StatusImovel {
  if (ajustes.excluidos.includes(id)) return 'excluido'
  if (ajustes.inativos.includes(id)) return 'inativo'
  return 'ativo'
}

/** Imóvel do CRM com as edições e a vitrine do painel aplicadas. */
export function aplicarAjustes(imovel: Imovel, ajustes: Ajustes): Imovel {
  const editado: Record<string, unknown> & Imovel = { ...imovel }
  for (const [campo, valor] of Object.entries(ajustes.editados[imovel.id] ?? {})) {
    if (valor === null) delete editado[campo]
    else editado[campo] = valor
  }
  if (ajustes.vitrine) {
    editado.heroi = ajustes.vitrine.heroi === imovel.id
    editado.destaque = ajustes.vitrine.destaques.includes(imovel.id)
  }
  return editado
}

/** Catálogo exibido no site: ajustes aplicados, sem inativos e excluídos. */
export function catalogoPublico(base: Imovel[], ajustes: Ajustes): Imovel[] {
  return base.filter((im) => statusDe(im.id, ajustes) === 'ativo').map((im) => aplicarAjustes(im, ajustes))
}

/** Campos de `novo` que diferem do original do CRM (o que precisa ser guardado). */
export function diferencas(original: Imovel, novo: Pick<Imovel, CampoEditavel>): Edicao {
  const edicao: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITAVEIS) {
    if (JSON.stringify(original[campo]) !== JSON.stringify(novo[campo])) edicao[campo] = novo[campo] ?? null
  }
  return edicao as Edicao
}
