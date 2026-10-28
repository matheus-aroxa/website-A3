// Cadastro de construtoras no banco (db/construtoras.sql): leitura e gravações do painel.
// A construtora padrão, "Não informado", é a dos imóveis sem construtora informada: não se altera nem se exclui.
import 'server-only'
import { banco, transacao } from '@/lib/db'
import { registrar } from './banco'
import { slugificar } from './formato'
import type { Construtora } from './tipos'

export interface ConstrutoraAdmin {
  id: number
  nome: string
  slug: string
  padrao: boolean
  /** Imóveis vinculados (publicados e desativados). */
  imoveis: number
}

export type ResultadoConstrutora = { ok: true } | { ok: false; erro: string }

const NOME_MAX = 120

/** Todas as construtoras, a padrão primeiro e as demais em ordem alfabética, com a contagem de imóveis. */
export async function listarConstrutorasAdmin(): Promise<ConstrutoraAdmin[]> {
  const { rows } = await banco().query<ConstrutoraAdmin>(
    `SELECT co.id, co.nome, co.slug, co.padrao, count(i.id)::int AS imoveis
       FROM construtoras co LEFT JOIN imoveis i ON i.construtora_id = co.id
      GROUP BY co.id`,
  )
  return rows.sort((a, b) => Number(b.padrao) - Number(a.padrao) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Id da construtora padrão ("Não informado"). */
export async function idConstrutoraPadrao(): Promise<number> {
  const { rows } = await banco().query<{ id: number }>('SELECT id FROM construtoras WHERE padrao')
  return rows[0]!.id
}

export async function obterConstrutora(id: number): Promise<Construtora | null> {
  const { rows } = await banco().query<Construtora>('SELECT id, nome, slug FROM construtoras WHERE id = $1', [id])
  return rows[0] ?? null
}

/** Limpa o nome digitado: sem espaços sobrando e dentro do limite. */
export const limparNome = (nome: unknown) => (typeof nome === 'string' ? nome.replace(/\s+/g, ' ').trim().slice(0, NOME_MAX) : '')

/** Já existe outra construtora com este nome (sem diferenciar maiúsculas) ou com o mesmo slug (sem acentos)? */
async function emUso(nome: string, slug: string, ignorarId = 0) {
  const { rowCount } = await banco().query(
    'SELECT 1 FROM construtoras WHERE id <> $3 AND (lower(nome) = lower($1) OR slug = $2)',
    [nome, slug, ignorarId],
  )
  return rowCount! > 0
}

export async function criarConstrutora(nomeBruto: string, autor: string): Promise<ResultadoConstrutora> {
  const nome = limparNome(nomeBruto)
  const slug = slugificar(nome)
  if (nome.length < 2 || !slug) return { ok: false, erro: 'Informe o nome da construtora.' }
  if (await emUso(nome, slug)) return { ok: false, erro: 'Já existe uma construtora com esse nome.' }
  await transacao(async (cliente) => {
    const { rows } = await cliente.query<{ id: number }>('INSERT INTO construtoras (nome, slug) VALUES ($1, $2) RETURNING id', [nome, slug])
    await registrar(cliente, { autor, acao: 'construtora-criar', campos: { id: rows[0]!.id, nome } })
  })
  return { ok: true }
}

/** Renomear muda o slug, e com ele o endereço do filtro no site (?construtora=...). */
export async function renomearConstrutora(id: number, nomeBruto: string, autor: string): Promise<ResultadoConstrutora> {
  const nome = limparNome(nomeBruto)
  const slug = slugificar(nome)
  if (nome.length < 2 || !slug) return { ok: false, erro: 'Informe o nome da construtora.' }
  const { rows } = await banco().query<{ nome: string; padrao: boolean }>('SELECT nome, padrao FROM construtoras WHERE id = $1', [id])
  const atual = rows[0]
  if (!atual) return { ok: false, erro: 'Construtora não encontrada.' }
  if (atual.padrao) return { ok: false, erro: 'A construtora padrão não pode ser alterada.' }
  if (await emUso(nome, slug, id)) return { ok: false, erro: 'Já existe uma construtora com esse nome.' }
  await transacao(async (cliente) => {
    await cliente.query('UPDATE construtoras SET nome = $2, slug = $3 WHERE id = $1', [id, nome, slug])
    await registrar(cliente, { autor, acao: 'construtora-renomear', campos: { id, de: atual.nome, para: nome } })
  })
  return { ok: true }
}

/** Só exclui construtora sem imóveis: os imóveis têm de ser passados para outra antes. */
export async function excluirConstrutora(id: number, autor: string): Promise<ResultadoConstrutora> {
  const { rows } = await banco().query<{ nome: string; padrao: boolean; imoveis: number }>(
    `SELECT co.nome, co.padrao, (SELECT count(*)::int FROM imoveis i WHERE i.construtora_id = co.id) AS imoveis
       FROM construtoras co WHERE co.id = $1`,
    [id],
  )
  const atual = rows[0]
  if (!atual) return { ok: false, erro: 'Construtora não encontrada.' }
  if (atual.padrao) return { ok: false, erro: 'A construtora padrão não pode ser excluída.' }
  if (atual.imoveis > 0) {
    const n = atual.imoveis
    return { ok: false, erro: `${atual.nome} tem ${n} ${n === 1 ? 'imóvel vinculado' : 'imóveis vinculados'}. Passe-${n === 1 ? 'o' : 'os'} para outra construtora antes de excluir.` }
  }
  try {
    await transacao(async (cliente) => {
      await cliente.query('DELETE FROM construtoras WHERE id = $1', [id])
      await registrar(cliente, { autor, acao: 'construtora-excluir', campos: { id, nome: atual.nome } })
    })
  } catch {
    // Um imóvel foi vinculado entre a conferência e a exclusão: a chave estrangeira recusa.
    return { ok: false, erro: 'Não foi possível excluir: a construtora acabou de receber um imóvel.' }
  }
  return { ok: true }
}
