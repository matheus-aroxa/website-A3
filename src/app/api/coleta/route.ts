// Recebe os eventos da medição de uso (src/components/coleta/Rastreador.tsx). Responde sempre 204 depressa e grava depois da
// resposta. Ignora a equipe (cookie do painel), quem pediu para não ser rastreado, robôs e pedidos de outras origens.
// Detalhes: docs/relatorios.md.
import { after, type NextRequest } from 'next/server'
import { coletaAtiva } from '@/lib/coleta/ativa'
import { lerCarga } from '@/lib/coleta/carga'
import { registrarCarga } from '@/lib/coleta/registrar'
import { COOKIE_EQUIPE } from '@/lib/coleta/tipos'

const SEM_CONTEUDO = () => new Response(null, { status: 204 })

export async function POST(request: NextRequest) {
  if (!coletaAtiva()) return SEM_CONTEUDO()
  // Só o próprio site envia; navegadores informam isso em Sec-Fetch-Site.
  const origem = request.headers.get('sec-fetch-site')
  if (origem && origem !== 'same-origin') return new Response(null, { status: 403 })
  if (request.cookies.has(COOKIE_EQUIPE)) return SEM_CONTEUDO()
  // Quem pediu para não ser rastreado (DNT ou Global Privacy Control) não entra na medição.
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return SEM_CONTEUDO()
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return new Response(null, { status: 413 })

  let carga
  try {
    carga = lerCarga(JSON.parse(await request.text()))
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!carga) return new Response(null, { status: 400 })

  const cabecalhos = request.headers
  after(() => registrarCarga({ carga, cabecalhos }))
  return SEM_CONTEUDO()
}
