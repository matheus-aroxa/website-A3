// Camada de acesso do painel: toda página e toda Server Action do /admin passa por aqui.
// O proxy (src/proxy.ts) já barra visitantes sem sessão, mas a checagem de verdade é esta,
// feita junto dos dados.
import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { COOKIE_SESSAO, DURACAO_LEMBRAR_S, DURACAO_SESSAO_S, criarToken, verificarToken, type Admin } from './sessao'

export const obterAdmin = cache(async (): Promise<Admin | null> => {
  // A validade do token depende do relógio: o painel nunca entra em prerender/prefetch.
  await connection()
  return verificarToken((await cookies()).get(COOKIE_SESSAO)?.value)
})

/** Admin logado ou redireciona para o login. */
export async function exigirAdmin(): Promise<Admin> {
  const admin = await obterAdmin()
  if (!admin) redirect('/admin/entrar')
  return admin
}

/**
 * `lembrar` ("Manter conectado"): cookie persistente de 30 dias. Sem ele, o cookie some ao
 * fechar o navegador e o token vale no máximo 8 h.
 */
export async function iniciarSessao(admin: Admin, lembrar = false) {
  const jar = await cookies()
  jar.set(COOKIE_SESSAO, criarToken(admin, lembrar ? DURACAO_LEMBRAR_S : DURACAO_SESSAO_S), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    ...(lembrar && { maxAge: DURACAO_LEMBRAR_S }),
  })
}

export async function encerrarSessao() {
  const jar = await cookies()
  jar.delete({ name: COOKIE_SESSAO, path: '/admin' })
}
