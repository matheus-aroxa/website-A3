import type { NextRequest } from 'next/server'
import { obterAdmin } from '@/lib/admin/acesso'
import { HOST_S3_FOTOS } from '@/lib/imoveis/hosts-fotos'
import { TAMANHO_MAXIMO_FOTO, apagarFotos, guardarFoto, pastaDoImovel } from '@/lib/admin/fotos'

/**
 * Envio de foto pelo formulário: POST /admin/enviar-foto (multipart, campos "foto" e "imovel", o id do imóvel).
 * É uma rota e não uma Server Action porque fotos de celular passam do limite de 1 MB das ações.
 * Grava o original e os tamanhos no S3 e devolve { src } para o formulário incluir na galeria; só vai ao site
 * quando o imóvel for salvo.
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
  const dados = await request.formData().catch(() => null)
  const foto = dados?.get('foto')
  if (!(foto instanceof File) || !foto.size) return Response.json({ erro: 'Nenhuma foto recebida.' }, { status: 400 })
  if (foto.size > TAMANHO_MAXIMO_FOTO) return Response.json({ erro: 'A foto passa de 15 MB.' }, { status: 413 })

  const imovel = dados?.get('imovel')
  const pasta = typeof imovel === 'string' ? await pastaDoImovel(imovel) : null
  if (!pasta) return Response.json({ erro: 'Imóvel não encontrado.' }, { status: 400 })

  try {
    const src = await guardarFoto(foto, pasta)
    if (!src) return Response.json({ erro: `${foto.name}: use JPG, PNG ou WebP.` }, { status: 415 })
    return Response.json({ src })
  } catch (erro) {
    console.error('Falha ao enviar foto ao S3:', erro)
    return Response.json({ erro: `Não foi possível guardar ${foto.name}. Tente de novo.` }, { status: 502 })
  }
}

/**
 * Apaga do S3 uma foto enviada nesta edição e tirada da galeria antes de salvar: DELETE /admin/enviar-foto com
 * { imovel, src } em JSON. Só vale para fotos da pasta do próprio imóvel que nenhum imóvel salvo usa; as fotos já
 * salvas saem do S3 quando o imóvel é salvo sem elas.
 */
export async function DELETE(request: NextRequest) {
  if (!mesmaOrigem(request)) return Response.json({ erro: 'Origem não permitida.' }, { status: 403 })
  if (!(await obterAdmin())) return Response.json({ erro: 'Sua sessão expirou. Entre de novo.' }, { status: 401 })

  const corpo = (await request.json().catch(() => null)) as { imovel?: unknown; src?: unknown } | null
  const pasta = typeof corpo?.imovel === 'string' ? await pastaDoImovel(corpo.imovel) : null
  const src = corpo?.src
  if (!pasta || typeof src !== 'string' || !src.startsWith(`https://${HOST_S3_FOTOS}/${pasta}/g_`)) {
    return Response.json({ erro: 'Foto não encontrada.' }, { status: 400 })
  }
  const { falhas } = await apagarFotos([src])
  return falhas ? Response.json({ erro: 'Não foi possível apagar a foto do S3.' }, { status: 502 }) : Response.json({ ok: true })
}
