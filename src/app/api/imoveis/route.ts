import type { NextRequest } from 'next/server'
import { interpretarSegmentos, lerFiltros, montarUrl, montarUrlApi } from '@/lib/imoveis/filtros'
import { buscarImoveis, listarCidades } from '@/lib/imoveis/repositorio'

/** JSON da busca, usado pelo "Carregar mais" do celular. Aceita os mesmos parâmetros da página. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const caminho = sp.get('caminho') ?? '/imoveis'
  const segmentos = caminho.replace(/^\/imoveis\/?/, '').split('/').filter(Boolean)
  const rota = interpretarSegmentos(segmentos, await listarCidades())
  if (!rota) return Response.json({ erro: 'Busca inválida' }, { status: 400 })

  const { filtros, pagina } = lerFiltros(rota, sp)
  const resultado = await buscarImoveis(filtros, pagina)
  const proxima =
    resultado.pagina < resultado.totalPaginas
      ? { url: montarUrl(filtros, resultado.pagina + 1), api: montarUrlApi(filtros, resultado.pagina + 1) }
      : null

  return Response.json(
    { itens: resultado.itens, total: resultado.total, proxima },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
