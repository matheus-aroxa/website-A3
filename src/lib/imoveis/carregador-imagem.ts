'use client'
// Loader do next/image para as fotos do catálogo (passado em `loader={carregadorImagem}` nas imagens de imóveis).
// Não é global: com `images.loader: 'custom'` o otimizador `/_next/image` deixa de existir e quebra logos, mapa e uploads.
// As fotos do S3 já têm os tamanhos prontos (400, 800 e 1600px, ver docs/fotos-s3.md): em vez de
// o Next baixar a foto e reprocessá-la, o loader aponta direto para o menor tamanho que cobre a largura pedida.
// O banco guarda o maior tamanho que existe para a foto (…/1600.webp, ou 800/400 nas fotos pequenas),
// então nunca se pede um tamanho maior que esse.
// Fotos da Viniun (catálogo no CRM) seguem o mesmo princípio: …/thumb/ (~300px), …/media/ (~800px) e …/grande/ (~1600px),
// e o catálogo guarda a grande. Qualquer outra imagem segue pelo otimizador padrão.

const HOSTS_S3 = ['a3-imoveis-fotos.s3.sa-east-1.amazonaws.com', 'dbn76pzkb0t3o.cloudfront.net']
const TAMANHOS = [400, 800, 1600]
const FOTO_S3 = /^(https:\/\/[^/]+\/.+\/)(\d+)\.webp$/

const HOST_VINIUN = 'midia.viniun.com.br'
const TAMANHOS_VINIUN = [
  { largura: 300, pasta: 'thumb' },
  { largura: 800, pasta: 'media' },
]
const FOTO_VINIUN = /^(https:\/\/[^/]+\/.+\/)grande(\/[^/]+)$/

export default function carregadorImagem({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const m = HOSTS_S3.some((h) => src.startsWith(`https://${h}/`)) ? FOTO_S3.exec(src) : null
  if (m) {
    const maximo = Number(m[2])
    const tamanho = TAMANHOS.find((t) => t >= width && t <= maximo) ?? maximo
    return `${m[1]}${tamanho}.webp`
  }
  const v = src.startsWith(`https://${HOST_VINIUN}/`) ? FOTO_VINIUN.exec(src) : null
  if (v) return `${v[1]}${TAMANHOS_VINIUN.find((t) => t.largura >= width)?.pasta ?? 'grande'}${v[2]}`
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
}
