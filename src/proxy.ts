import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, adminDoToken } from '@/lib/admin/sessao'
import { versaoDoCatalogo } from '@/lib/imoveis/banco'
import { buscarCidades } from '@/lib/imoveis/consultas'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import { catalogoNoPainel, fonteDosImoveis, inicioDoPainel } from '@/lib/imoveis/fonte'
import type { Cidade } from '@/lib/imoveis/tipos'
import { baixarCidades } from '@/lib/imoveis/viniun/carga'

// As páginas de busca são transmitidas por streaming (o status 200 sai antes do conteúdo).
// Para que URLs inexistentes como /imoveis/xyz respondam 404 de verdade — e não um
// "soft 404" — validamos os segmentos aqui, antes da renderização.

const VALIDADE_MS = 10 * 60 * 1000
// A versão do catálogo é conferida no máximo a cada tanto: é uma consulta ao banco por requisição.
const CONFERIR_A_CADA_MS = 5 * 1000
let cache: { cidades: Cidade[]; expiraEm: number; versao: string; conferidoEm: number } | null = null

// Catálogo na Viniun: não há "versão" barata de conferir, então a lista vale alguns minutos. Um bairro novo pode
// responder 404 nesse intervalo. Se a Viniun estiver fora do ar, segue com a última lista que deu certo.
const VALIDADE_VINIUN_MS = 5 * 60 * 1000
let cacheViniun: { cidades: Cidade[]; expiraEm: number } | null = null

async function cidadesDaViniun(): Promise<Cidade[] | null> {
  const agora = Date.now()
  if (cacheViniun && cacheViniun.expiraEm > agora) return cacheViniun.cidades
  try {
    cacheViniun = { cidades: await baixarCidades(), expiraEm: agora + VALIDADE_VINIUN_MS }
  } catch (erro) {
    console.error('[proxy] cidades da Viniun:', erro)
    if (!cacheViniun) return null
    cacheViniun.expiraEm = agora + 30_000
  }
  return cacheViniun.cidades
}

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

/** Telas do painel que só existem com o catálogo no banco (FONTE_IMOVEIS=banco). */
const SO_COM_CATALOGO = /^\/admin(\/(imoveis|construtoras|relatorios)(\/.*)?)?$/

// Painel: quem não tem sessão válida vai para o login antes de qualquer renderização.
// É só a primeira barreira; páginas e Server Actions conferem a sessão de novo (src/lib/admin/acesso.ts).
async function proxyAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl
  // POSTs são Server Actions: elas mesmas conferem a sessão (e respondem quando ela expirou).
  if (request.method !== 'GET' && pathname !== '/admin/entrar') return NextResponse.next()
  // A sessão fica no banco: uma consulta por navegação, e só se houver cookie.
  const admin = await adminDoToken(request.cookies.get(COOKIE_SESSAO)?.value)
  if (pathname === '/admin/entrar') {
    return admin ? NextResponse.redirect(new URL(inicioDoPainel(), request.url)) : NextResponse.next()
  }
  // A tela de administradores é só do principal (a página e as ações conferem de novo).
  if (admin && !admin.principal && pathname.startsWith('/admin/administradores')) return NextResponse.redirect(new URL(inicioDoPainel(), request.url))
  // Catálogo na Viniun: imóveis e construtoras são cadastrados lá, e os relatórios somem. O painel abre na vitrine.
  // As páginas e as ações conferem de novo.
  if (admin && !catalogoNoPainel() && SO_COM_CATALOGO.test(pathname)) {
    return NextResponse.redirect(new URL(inicioDoPainel(), request.url))
  }
  if (admin) return NextResponse.next()
  const login = new URL('/admin/entrar', request.url)
  if (pathname !== '/admin') login.searchParams.set('de', pathname)
  return NextResponse.redirect(login)
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) return await proxyAdmin(request)
  const segmentos = request.nextUrl.pathname.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  const lista = fonteDosImoveis() === 'viniun' ? await cidadesDaViniun() : await cidades()
  // Sem a lista (Viniun fora do ar e nada guardado), deixa a página decidir em vez de responder 404 para tudo.
  if (!lista || interpretarSegmentos(segmentos, lista)) return NextResponse.next()
  // Caminho sem rota: o Next responde com a página not-found e status 404.
  return NextResponse.rewrite(new URL('/_pagina-inexistente', request.url))
}

export const config = {
  matcher: ['/imoveis/:caminho+', '/admin', '/admin/:caminho*'],
}
