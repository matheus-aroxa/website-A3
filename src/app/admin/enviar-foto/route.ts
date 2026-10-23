import type { NextRequest } from 'next/server'
import { obterAdmin } from '@/lib/admin/acesso'
import { TAMANHO_MAXIMO_FOTO, guardarFoto } from '@/lib/admin/fotos'

/**
 * Envio de foto pelo formulário de edição: POST /admin/enviar-foto (multipart, campo "foto").
 * É uma rota e não uma Server Action porque fotos de celular passam do limite de 1 MB das ações.
 * Devolve { src } para o formulário incluir na galeria; só vai ao site quando o imóvel for salvo.
 */
function mesmaOrigem(request: NextRequest) {
  const origem = request.headers.get('origin')
  if (!origem) return true
  try {
    return new URL(origem).host === (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  // O cookie da sessão é SameSite=Strict; a origem é conferida também, como nas Server Actions.
  if (!mesmaOrigem(request)) return Response.json({ erro: 'Origem não permitida.' }, { status: 403 })
  if (!(await obterAdmin())) return Response.json({ erro: 'Sua sessão expirou. Entre de novo.' }, { status: 401 })

  if (Number(request.headers.get('content-length')) > TAMANHO_MAXIMO_FOTO + 64 * 1024) {
    return Response.json({ erro: 'A foto passa de 15 MB.' }, { status: 413 })
  }
  const foto = (await request.formData().catch(() => null))?.get('foto')
  if (!(foto instanceof File) || !foto.size) return Response.json({ erro: 'Nenhuma foto recebida.' }, { status: 400 })
  if (foto.size > TAMANHO_MAXIMO_FOTO) return Response.json({ erro: 'A foto passa de 15 MB.' }, { status: 413 })

  const src = await guardarFoto(foto)
  if (!src) return Response.json({ erro: `${foto.name}: use JPG, PNG ou WebP.` }, { status: 415 })
  return Response.json({ src })
}
