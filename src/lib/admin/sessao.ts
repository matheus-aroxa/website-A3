// Autenticação do painel, no banco (tabelas em db/schema.sql; como cadastrar administradores: docs/login-admin.md).
//
// - Administradores: tabela `administradores`, com a senha em bcrypt (pgcrypto). A conferência roda no próprio SQL.
// - Sessão: o cookie leva um token aleatório; a tabela `sessoes_admin` guarda só o SHA-256 dele. Dá para
//   encerrar uma sessão na hora (sair, desativar o administrador ou apagar a linha), sem esperar o cookie expirar.
// - Limite de tentativas: tabela `tentativas_login`, por IP e por e-mail. Vale entre reinícios e instâncias.
import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { banco } from '@/lib/db'

export const COOKIE_SESSAO = 'a3_admin'
export const DURACAO_SESSAO_S = 8 * 60 * 60
/** "Manter conectado" no login. */
export const DURACAO_LEMBRAR_S = 30 * 24 * 60 * 60

export interface Admin {
  id: string
  email: string
  nome: string | null
}

const normalizarEmail = (email: string) => email.trim().toLowerCase()
const hashDoToken = (token: string) => createHash('sha256').update(token).digest('hex')

// Hash de uma senha qualquer, com o mesmo custo dos reais: quando o e-mail não existe o banco confere a senha
// contra ele, para a resposta levar o mesmo tempo (não revela quem é administrador).
const HASH_FALSO = '$2a$12$AKWQCvLAfdSIOt5riIpfLOUHQgE/ktz7RcFnqSoBGlpGJ0kxSoZUe'

/** O painel só funciona com pelo menos um administrador ativo cadastrado. */
export async function painelConfigurado() {
  const { rows } = await banco().query<{ existe: boolean }>('SELECT EXISTS (SELECT 1 FROM administradores WHERE ativo) AS existe')
  return rows[0]!.existe
}

/** Confere e-mail e senha. Devolve o admin ou `null`. */
export async function autenticar(email: string, senha: string): Promise<Admin | null> {
  // Sempre uma linha, e o crypt() roda sempre (com o hash falso se o e-mail não existe ou está inativo).
  // `igual` fica numa coluna própria: dentro de um AND com `a.id IS NOT NULL` o banco poderia pular o crypt().
  const { rows } = await banco().query<{ id: string | null; email: string | null; nome: string | null; igual: boolean | null }>(
    `SELECT a.id, a.email, a.nome, (c.hash = a.senha_hash) AS igual
       FROM (SELECT 1) x
       LEFT JOIN administradores a ON a.email = $1 AND a.ativo
      CROSS JOIN LATERAL (SELECT extensions.crypt($2, COALESCE(a.senha_hash, $3)) AS hash) c`,
    [normalizarEmail(email), senha.normalize('NFKC'), HASH_FALSO],
  )
  const r = rows[0]
  return r?.igual === true && r.id && r.email ? { id: r.id, email: r.email, nome: r.nome } : null
}

// ---------- Sessões ----------

/** Abre uma sessão e devolve o token para o cookie. Aproveita para limpar o que já expirou. */
export async function criarSessao(admin: Admin, duracaoS: number, origem: { ip: string; agente: string }): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await banco().query("DELETE FROM sessoes_admin WHERE expira_em < now()")
  await banco().query(
    `INSERT INTO sessoes_admin (token_hash, admin_id, expira_em, ip, agente)
     VALUES ($1, $2, now() + make_interval(secs => $3), $4, $5)`,
    [hashDoToken(token), admin.id, duracaoS, origem.ip.slice(0, 64), origem.agente.slice(0, 300)],
  )
  await banco().query('UPDATE administradores SET ultimo_acesso = now() WHERE id = $1', [admin.id])
  return token
}

/** O admin dono da sessão, se ela existe, não expirou e o administrador continua ativo. */
export async function adminDoToken(token: string | undefined): Promise<Admin | null> {
  if (!token || token.length > 200) return null
  const { rows } = await banco().query<Admin>(
    `SELECT a.id, a.email, a.nome
       FROM sessoes_admin s JOIN administradores a ON a.id = s.admin_id
      WHERE s.token_hash = $1 AND s.expira_em > now() AND a.ativo`,
    [hashDoToken(token)],
  )
  return rows[0] ?? null
}

export async function encerrarSessaoDoToken(token: string | undefined) {
  if (token) await banco().query('DELETE FROM sessoes_admin WHERE token_hash = $1', [hashDoToken(token)])
}

// ---------- Limite de tentativas ----------

const JANELA = "interval '15 minutes'"
const MAX_POR_IP = 8
// Maior que o do IP: um atacante não consegue travar o login de outra pessoa só errando a senha dela.
const MAX_POR_EMAIL = 20

export async function loginBloqueado(ip: string, email: string) {
  const { rows } = await banco().query<{ por_ip: number; por_email: number }>(
    `SELECT count(*) FILTER (WHERE ip = $1)::int AS por_ip,
            count(*) FILTER (WHERE email = $2)::int AS por_email
       FROM tentativas_login WHERE em > now() - ${JANELA} AND (ip = $1 OR email = $2)`,
    [ip, normalizarEmail(email)],
  )
  const r = rows[0]!
  return r.por_ip >= MAX_POR_IP || r.por_email >= MAX_POR_EMAIL
}

export async function registrarFalha(ip: string, email: string) {
  await banco().query('INSERT INTO tentativas_login (ip, email) VALUES ($1, $2)', [ip, normalizarEmail(email).slice(0, 150)])
  await banco().query("DELETE FROM tentativas_login WHERE em < now() - interval '1 day'")
}

export async function limparFalhas(ip: string, email: string) {
  await banco().query('DELETE FROM tentativas_login WHERE ip = $1 OR email = $2', [ip, normalizarEmail(email)])
}
