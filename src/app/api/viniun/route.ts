import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { TAG_IMOVEIS } from '@/lib/imoveis/fonte'

const EVENTOS_DO_CATALOGO = ['imovel.publicado', 'imovel.atualizado', 'imovel.despublicado']

/**
 * Webhook da Viniun (Painel › Integrações › API & Webhooks › Webhooks), com os eventos imovel.publicado,
 * imovel.atualizado e imovel.despublicado: o site relê o catálogo na hora, em vez de esperar o cache expirar (1 h).
 *   POST /api/viniun   X-Viniun-Assinatura: HMAC-SHA256 (hex) do corpo, com o segredo do webhook (VINIUN_WEBHOOK_SECRET).
 */
export async function POST(request: NextRequest) {
  const segredo = process.env.VINIUN_WEBHOOK_SECRET
  const corpo = await request.text()
  const recebida = (request.headers.get('x-viniun-assinatura') ?? '').replace(/^sha256=/i, '').trim().toLowerCase()
  const esperada = segredo ? createHmac('sha256', segredo).update(corpo).digest('hex') : ''
  if (!segredo || recebida.length !== esperada.length || !timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada))) {
    return Response.json({ ok: false, erro: 'Assinatura inválida' }, { status: 401 })
  }

  let evento: string | undefined
  try {
    evento = (JSON.parse(corpo) as { evento?: string }).evento
  } catch {
    return Response.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }
  if (!evento || !EVENTOS_DO_CATALOGO.includes(evento)) return Response.json({ ok: true, ignorado: evento ?? null })

  revalidateTag(TAG_IMOVEIS, 'max')
  return Response.json({ ok: true, revalidado: TAG_IMOVEIS })
}
