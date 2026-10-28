// Cadastro de administradores pelo painel (/admin/administradores): só o principal lê e grava aqui (db/administradores.sql).
// O principal não aparece com ações: não pode ser desativado, e o papel só passa para outro pelo SQL (docs/login-admin.md).
import 'server-only'
import { FUSO } from '@/lib/coleta/dia'
import { banco, transacao } from '@/lib/db'
import { registrar } from '@/lib/imoveis/banco'
import { exigirPrincipal } from './acesso'

export interface AdministradorPainel {
  id: string
  /** O que se digita no campo "Usuário" do login (coluna `email`). */
  usuario: string
  nome: string | null
  ativo: boolean
  principal: boolean
  /** Data e hora do último login, no horário de Recife; `null` se nunca entrou. */
  ultimoAcesso: string | null
}

export type ResultadoAdministrador = { ok: true } | { ok: false; erro: string }

const NOME_MAX = 120
// O login corta a senha em 200 caracteres: uma maior nunca conferiria.
const SENHA_MIN = 10
const SENHA_MAX = 200
// O banco exige minúsculas e sem espaços nas pontas; o resto evita usuários difíceis de digitar.
const USUARIO = /^[a-z0-9._@-]{3,150}$/

const dataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' })

/** O principal primeiro, depois os ativos e por fim os desativados, cada grupo em ordem alfabética. */
export async function listarAdministradores(): Promise<AdministradorPainel[]> {
  await exigirPrincipal()
  const { rows } = await banco().query<{ id: string; email: string; nome: string | null; ativo: boolean; principal: boolean; ultimo_acesso: Date | null }>(
    'SELECT id, email, nome, ativo, principal, ultimo_acesso FROM administradores',
  )
  const rotulo = (a: { nome: string | null; email: string }) => a.nome ?? a.email
  return rows
    .sort((a, b) => Number(b.principal) - Number(a.principal) || Number(b.ativo) - Number(a.ativo) || rotulo(a).localeCompare(rotulo(b), 'pt-BR'))
    .map((a) => ({
      id: a.id,
      usuario: a.email,
      nome: a.nome,
      ativo: a.ativo,
      principal: a.principal,
      ultimoAcesso: a.ultimo_acesso ? dataHora.format(a.ultimo_acesso) : null,
    }))
}

/** Novo administrador comum (nunca principal), já ativo. A senha é a de primeiro acesso, que o principal repassa. */
export async function criarAdministrador(dados: { nome: unknown; usuario: unknown; senha: unknown }, autor: string): Promise<ResultadoAdministrador> {
  const nome = typeof dados.nome === 'string' ? dados.nome.replace(/\s+/g, ' ').trim().slice(0, NOME_MAX) : ''
  const usuario = typeof dados.usuario === 'string' ? dados.usuario.trim().toLowerCase() : ''
  const senha = typeof dados.senha === 'string' ? dados.senha : ''
  if (nome.length < 2) return { ok: false, erro: 'Informe o nome do administrador.' }
  if (!USUARIO.test(usuario)) {
    return { ok: false, erro: 'O usuário precisa ter de 3 a 150 caracteres, só com letras sem acento, números, ponto, hífen, sublinhado ou @.' }
  }
  if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) return { ok: false, erro: `A senha precisa ter de ${SENHA_MIN} a ${SENHA_MAX} caracteres.` }
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
    if ((erro as { code?: string }).code === '23505') return { ok: false, erro: 'Já existe um administrador com esse usuário.' }
    throw erro
  }
  return { ok: true }
}

/**
 * Desativar tira o acesso na hora e apaga as sessões abertas: sem isso, reativar o administrador
 * faria valer de novo uma sessão antiga que ainda não expirou.
 */
export async function definirAtivo(id: string, ativo: boolean, autor: string): Promise<ResultadoAdministrador> {
  const { rows } = await banco().query<{ email: string; principal: boolean }>('SELECT email, principal FROM administradores WHERE id = $1', [id])
  const atual = rows[0]
  if (!atual) return { ok: false, erro: 'Administrador não encontrado.' }
  if (atual.principal) return { ok: false, erro: 'O administrador principal não pode ser desativado.' }
  await transacao(async (cliente) => {
    await cliente.query('UPDATE administradores SET ativo = $2 WHERE id = $1', [id, ativo])
    if (!ativo) await cliente.query('DELETE FROM sessoes_admin WHERE admin_id = $1', [id])
    await registrar(cliente, { autor, acao: ativo ? 'admin-ativar' : 'admin-desativar', campos: { id, usuario: atual.email } })
  })
  return { ok: true }
}
