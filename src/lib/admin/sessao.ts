// Autenticação do painel sem banco de dados.
//
// - Usuários: variável ADMIN_USUARIOS, no formato "usuario:hash,usuario:hash" (usuário ou e-mail). O hash (scrypt com
//   sal aleatório) é gerado por `node scripts/gerar-senha-admin.mjs`; a senha nunca fica salva.
// - Sessão: cookie assinado com HMAC-SHA256 (ADMIN_SESSAO_SEGREDO), sem estado no servidor.
//   O token carrega uma impressão do hash da senha: trocar a senha ou remover o usuário
//   derruba as sessões dele; trocar o segredo derruba todas.
import 'server-only'
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

export const COOKIE_SESSAO = 'a3_admin'
export const DURACAO_SESSAO_S = 8 * 60 * 60
/** "Manter conectado" no login. */
export const DURACAO_LEMBRAR_S = 30 * 24 * 60 * 60

// Parâmetros do scrypt (iguais aos de scripts/gerar-senha-admin.mjs).
const N = 16384
const R = 8
const P = 1
const TAMANHO = 32

export interface Admin {
  email: string
}

interface Usuario {
  email: string
  hash: string
}

// Admin padrão para desenvolvimento: usuário "admin", senha "admin". Só vale fora de produção
// e enquanto ADMIN_USUARIOS estiver vazio; em produção o painel exige usuários configurados.
const DESENVOLVIMENTO = process.env.NODE_ENV !== 'production'
const ADMIN_PADRAO: Usuario = { email: 'admin', hash: 's1.oR_H7AxAuIRI1AP7AbdQQA.DCYoJbxqiIe8TSOtIbXh8FBuPG3BHmh41o8Ed4OJNAQ' }
const SEGREDO_DESENVOLVIMENTO = 'segredo-apenas-para-desenvolvimento-local-nao-use-em-producao'

function usuarios(): Usuario[] {
  if (!process.env.ADMIN_USUARIOS?.trim() && DESENVOLVIMENTO) return [ADMIN_PADRAO]
  return (process.env.ADMIN_USUARIOS ?? '')
    .split(',')
    .map((par) => par.trim())
    .filter(Boolean)
    .map((par) => {
      const i = par.indexOf(':')
      return { email: par.slice(0, i).trim().toLowerCase(), hash: par.slice(i + 1).trim() }
    })
    .filter((u) => u.email && u.hash.startsWith('s1.'))
}

function segredo() {
  const s = process.env.ADMIN_SESSAO_SEGREDO || (DESENVOLVIMENTO ? SEGREDO_DESENVOLVIMENTO : '')
  return s.length >= 32 ? s : null
}

/** O painel só funciona com segredo e pelo menos um usuário configurados. */
export function painelConfigurado() {
  return segredo() !== null && usuarios().length > 0
}

function derivar(senha: string, sal: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(senha.normalize('NFKC'), sal, TAMANHO, { N, r: R, p: P }, (erro, chave) => (erro ? reject(erro) : resolve(chave)))
  )
}

// Usado quando o e-mail não existe, para a resposta levar o mesmo tempo (não revela quem é usuário).
const HASH_FALSO = `s1.${randomBytes(16).toString('base64url')}.${randomBytes(TAMANHO).toString('base64url')}`

/** Confere e-mail e senha. Devolve o admin ou `null`. */
export async function autenticar(email: string, senha: string): Promise<Admin | null> {
  const usuario = usuarios().find((u) => u.email === email.trim().toLowerCase())
  const [, sal, esperado] = (usuario?.hash ?? HASH_FALSO).split('.')
  const obtido = await derivar(senha, Buffer.from(sal ?? '', 'base64url'))
  const alvo = Buffer.from(esperado ?? '', 'base64url')
  const confere = alvo.length === obtido.length && timingSafeEqual(alvo, obtido)
  return usuario && confere ? { email: usuario.email } : null
}

const impressao = (hash: string) => createHash('sha256').update(hash).digest('base64url').slice(0, 12)
const assinar = (dados: string, chave: string) => createHmac('sha256', chave).update(dados).digest('base64url')

/** Token do cookie: dados em base64url + "." + assinatura. */
export function criarToken(admin: Admin, duracao = DURACAO_SESSAO_S): string {
  const chave = segredo()
  const usuario = usuarios().find((u) => u.email === admin.email)
  if (!chave || !usuario) throw new Error('Painel administrativo não configurado.')
  const expira = Math.floor(Date.now() / 1000) + duracao
  const dados = Buffer.from(JSON.stringify({ e: usuario.email, x: expira, h: impressao(usuario.hash) })).toString('base64url')
  return `${dados}.${assinar(dados, chave)}`
}

export function verificarToken(token: string | undefined): Admin | null {
  const chave = segredo()
  if (!chave || !token) return null
  const [dados, assinatura] = token.split('.')
  if (!dados || !assinatura) return null
  const esperada = Buffer.from(assinar(dados, chave))
  const recebida = Buffer.from(assinatura)
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null
  try {
    const { e, x, h } = JSON.parse(Buffer.from(dados, 'base64url').toString()) as { e: string; x: number; h: string }
    if (x * 1000 < Date.now()) return null
    const usuario = usuarios().find((u) => u.email === e)
    return usuario && impressao(usuario.hash) === h ? { email: usuario.email } : null
  } catch {
    return null
  }
}

// Limite de tentativas de login por IP (em memória; reinicia com o servidor).
const TENTATIVAS_MAX = 8
const JANELA_MS = 15 * 60 * 1000
const tentativas = new Map<string, { falhas: number; desde: number }>()

export function loginBloqueado(ip: string) {
  const t = tentativas.get(ip)
  if (!t) return false
  if (Date.now() - t.desde > JANELA_MS) {
    tentativas.delete(ip)
    return false
  }
  return t.falhas >= TENTATIVAS_MAX
}

export function registrarFalha(ip: string) {
  const t = tentativas.get(ip)
  if (!t || Date.now() - t.desde > JANELA_MS) tentativas.set(ip, { falhas: 1, desde: Date.now() })
  else t.falhas++
  // Evita crescer sem limite sob ataque distribuído.
  if (tentativas.size > 10_000) tentativas.clear()
}

export function limparFalhas(ip: string) {
  tentativas.delete(ip)
}
