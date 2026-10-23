import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, verificarToken } from '@/lib/admin/sessao'
import { crm } from '@/lib/crm'
import { catalogoPublico, lerAjustes } from '@/lib/imoveis/ajustes'
import { extrairCidades } from '@/lib/imoveis/busca'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import type { Cidade } from '@/lib/imoveis/tipos'

// As páginas de busca são transmitidas por streaming (o status 200 sai antes do conteúdo).
// Para que URLs inexistentes como /imoveis/xyz respondam 404 de verdade — e não um
// "soft 404" — validamos os segmentos aqui, antes da renderização.

const VALIDADE_MS = 10 * 60 * 1000
let cache: { cidades: Cidade[]; expiraEm: number; versao?: string } | null = null

async function cidades() {
  // O painel pode mudar bairro/cidade ou desativar imóveis: a versão dos ajustes invalida o cache.
  const ajustes = await lerAjustes()
  if (!cache || cache.expiraEm < Date.now() || cache.versao !== ajustes.atualizadoEm) {
    const imoveis = catalogoPublico(await crm.listarImoveis(), ajustes)
    cache = { cidades: extrairCidades(imoveis), expiraEm: Date.now() + VALIDADE_MS, versao: ajustes.atualizadoEm }
  }
  return cache.cidades
}

// Painel: quem não tem sessão válida vai para o login antes de qualquer renderização.
// É só a primeira barreira; páginas e Server Actions conferem a sessão de novo (src/lib/admin/acesso.ts).
function proxyAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl
  const logado = verificarToken(request.cookies.get(COOKIE_SESSAO)?.value) !== null
  if (pathname === '/admin/entrar') {
    return logado ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next()
  }
  // POSTs são Server Actions: elas mesmas respondem quando a sessão expirou.
  if (logado || request.method !== 'GET') return NextResponse.next()
  const login = new URL('/admin/entrar', request.url)
  if (pathname !== '/admin') login.searchParams.set('de', pathname)
  return NextResponse.redirect(login)
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) return proxyAdmin(request)
  const segmentos = request.nextUrl.pathname.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  if (interpretarSegmentos(segmentos, await cidades())) return NextResponse.next()
  // Caminho sem rota: o Next responde com a página not-found e status 404.
  return NextResponse.rewrite(new URL('/_pagina-inexistente', request.url))
}

export const config = {
  matcher: ['/imoveis/:caminho+', '/admin', '/admin/:caminho*'],
}
