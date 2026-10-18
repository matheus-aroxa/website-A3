import { NextResponse, type NextRequest } from 'next/server'
import { crm } from '@/lib/crm'
import { extrairCidades } from '@/lib/imoveis/busca'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import type { Cidade } from '@/lib/imoveis/tipos'

// As páginas de busca são transmitidas por streaming (o status 200 sai antes do conteúdo).
// Para que URLs inexistentes como /imoveis/xyz respondam 404 de verdade — e não um
// "soft 404" — validamos os segmentos aqui, antes da renderização.

const VALIDADE_MS = 10 * 60 * 1000
let cache: { cidades: Cidade[]; expiraEm: number } | null = null

async function cidades() {
  if (!cache || cache.expiraEm < Date.now()) {
    cache = { cidades: extrairCidades(await crm.listarImoveis()), expiraEm: Date.now() + VALIDADE_MS }
  }
  return cache.cidades
}

export async function proxy(request: NextRequest) {
  const segmentos = request.nextUrl.pathname.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  if (interpretarSegmentos(segmentos, await cidades())) return NextResponse.next()
  // Caminho sem rota: o Next responde com a página not-found e status 404.
  return NextResponse.rewrite(new URL('/_pagina-inexistente', request.url))
}

export const config = {
  matcher: '/imoveis/:caminho+',
}
