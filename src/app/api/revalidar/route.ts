import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { TAG_IMOVEIS } from '@/lib/imoveis/repositorio'

/**
 * Invalida o cache do catálogo à mão, por exemplo depois de mexer direto no banco (o painel já faz isso sozinho).
 *   POST /api/revalidar   Authorization: Bearer <REVALIDATE_SECRET>
 * As páginas são regeneradas em segundo plano; visitantes nunca esperam.
 */
export async function POST(request: NextRequest) {
  const segredo = process.env.REVALIDATE_SECRET
  const enviado = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!segredo || enviado !== segredo) {
    return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })
  }
  revalidateTag(TAG_IMOVEIS, 'max')
  return Response.json({ ok: true, revalidado: TAG_IMOVEIS })
}
