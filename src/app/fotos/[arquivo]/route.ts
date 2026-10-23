import { lerFoto } from '@/lib/admin/fotos'

// Fotos enviadas pelo painel. O nome é um UUID e nunca muda: o arquivo pode ficar em cache para sempre.
export async function GET(_: Request, { params }: RouteContext<'/fotos/[arquivo]'>) {
  const foto = await lerFoto((await params).arquivo)
  if (!foto) return new Response('Foto não encontrada.', { status: 404 })
  return new Response(new Uint8Array(foto.dados), {
    headers: {
      'Content-Type': foto.tipo,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
