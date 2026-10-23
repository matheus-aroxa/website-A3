import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, adminDoToken } from '@/lib/admin/sessao'
import { versaoDoCatalogo } from '@/lib/imoveis/banco'
import { buscarCidades } from '@/lib/imoveis/consultas'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import type { Cidade } from '@/lib/imoveis/tipos'

// As páginas de busca são transmitidas por streaming (o status 200 sai antes do conteúdo).
// Para que URLs inexistentes como /imoveis/xyz respondam 404 de verdade — e não um
// "soft 404" — validamos os segmentos aqui, antes da renderização.

const VALIDADE_MS = 10 * 60 * 1000
// A versão do catálogo é conferida no máximo a cada tanto: é uma consulta ao banco por requisição.
const CONFERIR_A_CADA_MS = 5 * 1000
let cache: { cidades: Cidade[]; expiraEm: number; versao: string; conferidoEm: number } | null = null

async function cidades() {
  const agora = Date.now()
  if (cache && cache.expiraEm > agora && cache.conferidoEm + CONFERIR_A_CADA_MS > agora) return cache.cidades
  // O painel pode mudar bairro/cidade ou desativar imóveis: a versão do catálogo invalida o cache.
  const versao = await versaoDoCatalogo()
  if (cache && cache.expiraEm > agora && cache.versao === versao) {
    cache.conferidoEm = agora
    return cache.cidades
  }
  cache = { cidades: await buscarCidades(), expiraEm: agora + VALIDADE_MS, versao, conferidoEm: agora }
  return cache.cidades
}

// Painel: quem não tem sessão válida vai para o login antes de qualquer renderização.
// É só a primeira barreira; páginas e Server Actions conferem a sessão de novo (src/lib/admin/acesso.ts).
async function proxyAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl
  // POSTs são Server Actions: elas mesmas conferem a sessão (e respondem quando ela expirou).
  if (request.method !== 'GET' && pathname !== '/admin/entrar') return NextResponse.next()
  // A sessão fica no banco: uma consulta por navegação, e só se houver cookie.
  const logado = (await adminDoToken(request.cookies.get(COOKIE_SESSAO)?.value)) !== null
  if (pathname === '/admin/entrar') {
    return logado ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next()
  }
  if (logado) return NextResponse.next()
  const login = new URL('/admin/entrar', request.url)
  if (pathname !== '/admin') login.searchParams.set('de', pathname)
  return NextResponse.redirect(login)
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) return await proxyAdmin(request)
  const segmentos = request.nextUrl.pathname.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  if (interpretarSegmentos(segmentos, await cidades())) return NextResponse.next()
  // Caminho sem rota: o Next responde com a página not-found e status 404.
  return NextResponse.rewrite(new URL('/_pagina-inexistente', request.url))
}

export const config = {
  matcher: ['/imoveis/:caminho+', '/admin', '/admin/:caminho*'],
}
