import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, adminDoToken } from '@/lib/admin/sessao'
import { versaoDoCatalogo } from '@/lib/imoveis/banco'
import { buscarCidades } from '@/lib/imoveis/consultas'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import { catalogoNoPainel, fonteDosImoveis, inicioDoPainel } from '@/lib/imoveis/fonte'
import type { Cidade } from '@/lib/imoveis/tipos'
import { baixarCidades } from '@/lib/imoveis/viniun/carga'
import { ehIdioma, secaoDoCaminho } from '@/lib/internacional/idiomas'

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

// Caminho sem nenhuma rota (o mais longo da área internacional tem 3 segmentos): o Next responde com a 404 global
// (app/global-not-found.tsx) e status 404.
const SEM_ROTA = '/_/pagina/nao/encontrada'
const naoEncontrada = (request: NextRequest) => NextResponse.rewrite(new URL(SEM_ROTA, request.url))

/**
 * Área internacional: tudo o que não é rota do site em português chega aqui (o matcher abaixo). Só passam o idioma e,
 * depois dele, uma seção válida naquele idioma ("/en/properties", não "/en/immobili"); a ficha de imóvel só sob a seção
 * de imóveis. O resto vira 404 antes de renderizar. Imóvel inexistente ou fora do recorte: a própria ficha responde 404.
 */
function proxyInternacional(request: NextRequest) {
  const [idioma, secao, slug, ...resto] = request.nextUrl.pathname.split('/').filter(Boolean)
  if (!idioma || !ehIdioma(idioma) || resto.length) return naoEncontrada(request)
  if (!secao) return NextResponse.next()
  const qual = secaoDoCaminho(idioma, secao)
  if (!qual || (slug && qual !== 'imoveis')) return naoEncontrada(request)
  return NextResponse.next()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return await proxyAdmin(request)
  if (!pathname.startsWith('/imoveis/')) return proxyInternacional(request)
  const segmentos = pathname.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  const lista = fonteDosImoveis() === 'viniun' ? await cidadesDaViniun() : await cidades()
  // Sem a lista (Viniun fora do ar e nada guardado), deixa a página decidir em vez de responder 404 para tudo.
  if (!lista || interpretarSegmentos(segmentos, lista)) return NextResponse.next()
  return naoEncontrada(request)
}

// Rotas do site em português e arquivos ficam de fora (exceto a busca e o painel, conferidos acima): o resto do
// primeiro nível é o segmento [idioma] da área internacional, que aceitaria qualquer coisa. O matcher precisa ser
// texto fixo (o Next o lê no build).
export const config = {
  matcher: [
    '/imoveis/:caminho+',
    '/admin',
    '/admin/:caminho*',
    '/((?!imoveis(?:/|$)|imovel/|politica-de-privacidade$|admin(?:/|$)|api/|fotos/|_next/|_vercel/|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|favicon\\.ico|icon|apple-icon|opengraph-image).+)',
  ],
}
