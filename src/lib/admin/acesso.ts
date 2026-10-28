// Camada de acesso do painel: toda página e toda Server Action do /admin passa por aqui.
// O proxy (src/proxy.ts) só barra quem nem tem o cookie de sessão; a checagem de verdade é esta,
// no banco, junto dos dados.
import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { COOKIE_EQUIPE } from '@/lib/coleta/tipos'
import { COOKIE_SESSAO, DURACAO_LEMBRAR_S, DURACAO_SESSAO_S, adminDoToken, criarSessao, encerrarSessaoDoToken, type Admin } from './sessao'

export const obterAdmin = cache(async (): Promise<Admin | null> => {
  // A validade da sessão depende do relógio e do banco: o painel nunca entra em prerender/prefetch.
  await connection()
  return adminDoToken((await cookies()).get(COOKIE_SESSAO)?.value)
})

/** Admin logado ou redireciona para o login. */
export async function exigirAdmin(): Promise<Admin> {
  const admin = await obterAdmin()
  if (!admin) redirect('/admin/entrar')
  return admin
}

/**
 * `lembrar` ("Manter conectado"): cookie persistente de 30 dias. Sem ele, o cookie some ao
 * fechar o navegador e a sessão vale no máximo 8 h.
 */
export async function iniciarSessao(admin: Admin, ip: string, lembrar = false) {
  const duracao = lembrar ? DURACAO_LEMBRAR_S : DURACAO_SESSAO_S
  const agente = (await headers()).get('user-agent') ?? ''
  const token = await criarSessao(admin, duracao, { ip, agente })
  const jar = await cookies()
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    ...(lembrar && { maxAge: DURACAO_LEMBRAR_S }),
  })
  // Marca este navegador como da equipe: as visitas dele ao site não entram nos relatórios (src/app/api/coleta/route.ts).
  // Não sai junto com a sessão: quem trabalha na A3 continua fora dos números mesmo depois de sair do painel.
  jar.set(COOKIE_EQUIPE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
}

export async function encerrarSessao() {
  const jar = await cookies()
  await encerrarSessaoDoToken(jar.get(COOKIE_SESSAO)?.value)
  jar.delete({ name: COOKIE_SESSAO, path: '/admin' })
}
