// Cadastro de administradores pelo painel (/admin/administradores): só o principal lê e grava aqui (db/administradores.sql).
// O principal edita os próprios dados, mas não pode ser excluído, e o papel só passa para outro pelo SQL (docs/login-admin.md).
import 'server-only'
import { banco, transacao } from '@/lib/db'
import { registrar } from '@/lib/imoveis/banco'
import { exigirPrincipal } from './acesso'

export interface AdministradorPainel {
  id: string
  /** O que se digita no campo "Usuário" do login (coluna `email`). */
  usuario: string
  nome: string | null
  principal: boolean
}

export type ResultadoAdministrador = { ok: true } | { ok: false; erro: string }

const NOME_MAX = 120
// O login corta a senha em 200 caracteres: uma maior nunca conferiria.
const SENHA_MIN = 10
const SENHA_MAX = 200
// O banco exige minúsculas e sem espaços nas pontas; o resto evita usuários difíceis de digitar.
const USUARIO = /^[a-z0-9._@-]{3,150}$/

/** O principal primeiro, depois os demais em ordem alfabética. */
export async function listarAdministradores(): Promise<AdministradorPainel[]> {
  await exigirPrincipal()
  const { rows } = await banco().query<{ id: string; email: string; nome: string | null; principal: boolean }>(
    'SELECT id, email, nome, principal FROM administradores',
  )
  const rotulo = (a: { nome: string | null; email: string }) => a.nome ?? a.email
  return rows
    .sort((a, b) => Number(b.principal) - Number(a.principal) || rotulo(a).localeCompare(rotulo(b), 'pt-BR'))
    .map((a) => ({
      id: a.id,
      usuario: a.email,
      nome: a.nome,
      principal: a.principal,
    }))
}

type Dados = { nome: unknown; usuario: unknown; senha: unknown }

/** Confere e normaliza os campos. `senhaOpcional`: na edição, senha vazia mantém a atual. */
function validar(dados: Dados, senhaOpcional: boolean): { ok: true; nome: string; usuario: string; senha: string } | { ok: false; erro: string } {
  const nome = typeof dados.nome === 'string' ? dados.nome.replace(/\s+/g, ' ').trim().slice(0, NOME_MAX) : ''
  const usuario = typeof dados.usuario === 'string' ? dados.usuario.trim().toLowerCase() : ''
  const senha = typeof dados.senha === 'string' ? dados.senha : ''
  if (nome.length < 2) return { ok: false, erro: 'Informe o nome do administrador.' }
  if (!USUARIO.test(usuario)) {
    return { ok: false, erro: 'O usuário precisa ter de 3 a 150 caracteres, só com letras sem acento, números, ponto, hífen, sublinhado ou @.' }
  }
  if (!(senhaOpcional && senha === '') && (senha.length < SENHA_MIN || senha.length > SENHA_MAX)) {
    return { ok: false, erro: `A senha precisa ter de ${SENHA_MIN} a ${SENHA_MAX} caracteres.` }
  }
  return { ok: true, nome, usuario, senha }
}

const USUARIO_REPETIDO = 'Já existe um administrador com esse usuário.'
const repetido = (erro: unknown) => (erro as { code?: string }).code === '23505'

/** Novo administrador comum (nunca principal), já ativo. A senha é a de primeiro acesso, que o principal repassa. */
export async function criarAdministrador(dados: Dados, autor: string): Promise<ResultadoAdministrador> {
  const v = validar(dados, false)
  if (!v.ok) return v
  const { nome, usuario, senha } = v
  try {
    await transacao(async (cliente) => {
      // Mesma normalização e mesmo custo do login (src/lib/admin/sessao.ts).
      const { rows } = await cliente.query<{ id: string }>(
        `INSERT INTO administradores (email, nome, senha_hash)
         VALUES ($1, $2, extensions.crypt($3, extensions.gen_salt('bf', 12))) RETURNING id`,
        [usuario, nome, senha.normalize('NFKC')],
      )
      await registrar(cliente, { autor, acao: 'admin-criar', campos: { id: rows[0]!.id, usuario, nome } })
    })
  } catch (erro) {
    if (repetido(erro)) return { ok: false, erro: USUARIO_REPETIDO }
    throw erro
  }
  return { ok: true }
}

/**
 * Troca nome, usuário e (se veio preenchida) a senha de um administrador (o principal também pode editar a si mesmo).
 * Senha nova derruba as sessões abertas dele, como na troca pelo SQL; mudar só o nome ou o usuário não, porque a sessão
 * não depende deles. `sessaoAtual` (hash do token de quem edita a si mesmo) é a única que sobrevive, para não deslogá-lo.
 */
export async function editarAdministrador(id: string, dados: Dados, autor: string, sessaoAtual?: string): Promise<ResultadoAdministrador> {
  const v = validar(dados, true)
  if (!v.ok) return v
  const { nome, usuario, senha } = v
  const { rows } = await banco().query<{ email: string; nome: string | null }>('SELECT email, nome FROM administradores WHERE id = $1', [id])
  const atual = rows[0]
  if (!atual) return { ok: false, erro: 'Administrador não encontrado.' }
  // Só o que mudou vai para a auditoria; a senha nunca, só o fato de ter sido trocada.
  const campos: Record<string, unknown> = {}
  if (usuario !== atual.email) campos.usuario = { de: atual.email, para: usuario }
  if (nome !== atual.nome) campos.nome = { de: atual.nome, para: nome }
  if (senha) campos.senha = 'trocada'
  if (Object.keys(campos).length === 0) return { ok: true }
  try {
    await transacao(async (cliente) => {
      await cliente.query(
        `UPDATE administradores SET email = $2, nome = $3,
                senha_hash = CASE WHEN $4::text IS NULL THEN senha_hash ELSE extensions.crypt($4, extensions.gen_salt('bf', 12)) END
          WHERE id = $1`,
        [id, usuario, nome, senha ? senha.normalize('NFKC') : null],
      )
      if (senha) await cliente.query('DELETE FROM sessoes_admin WHERE admin_id = $1 AND token_hash IS DISTINCT FROM $2', [id, sessaoAtual ?? null])
      await registrar(cliente, { autor, acao: 'admin-editar', campos: { id, ...campos } })
    })
  } catch (erro) {
    if (repetido(erro)) return { ok: false, erro: USUARIO_REPETIDO }
    throw erro
  }
  return { ok: true }
}

/**
 * Exclui de vez. As sessões abertas dele caem junto (chave estrangeira em cascata), então o acesso acaba na hora.
 * O principal não é excluído: ninguém mais conseguiria cadastrar administradores pelo painel.
 */
export async function excluirAdministrador(id: string, autor: string): Promise<ResultadoAdministrador> {
  const { rows } = await banco().query<{ email: string; nome: string | null; principal: boolean }>(
    'SELECT email, nome, principal FROM administradores WHERE id = $1',
    [id],
  )
  const atual = rows[0]
  if (!atual) return { ok: false, erro: 'Administrador não encontrado.' }
  if (atual.principal) return { ok: false, erro: 'O administrador principal não pode ser excluído.' }
  await transacao(async (cliente) => {
    await cliente.query('DELETE FROM administradores WHERE id = $1', [id])
    await registrar(cliente, { autor, acao: 'admin-excluir', campos: { id, usuario: atual.email, nome: atual.nome } })
  })
  return { ok: true }
}
