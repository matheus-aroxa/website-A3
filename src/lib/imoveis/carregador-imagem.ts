'use client'
// Loader do next/image para as fotos do catálogo (passado em `loader={carregadorImagem}` nas imagens de imóveis).
// Não é global: com `images.loader: 'custom'` o otimizador `/_next/image` deixa de existir e quebra logos, mapa e uploads.
// As fotos do S3 já têm os tamanhos prontos (400, 800 e 1600px, ver docs/fotos-s3.md): em vez de
// o Next baixar a foto e reprocessá-la, o loader aponta direto para o menor tamanho que cobre a largura pedida.
// O banco guarda o maior tamanho que existe para a foto (…/1600.webp, ou 800/400 nas fotos pequenas),
// então nunca se pede um tamanho maior que esse. Qualquer outra imagem segue pelo otimizador padrão.

const HOST_S3 = 'a3-imoveis-fotos.s3.sa-east-1.amazonaws.com'
const TAMANHOS = [400, 800, 1600]
const FOTO_S3 = /^(https:\/\/[^/]+\/.+\/)(\d+)\.webp$/

export default function carregadorImagem({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const m = src.startsWith(`https://${HOST_S3}/`) ? FOTO_S3.exec(src) : null
  if (m) {
    const maximo = Number(m[2])
    const tamanho = TAMANHOS.find((t) => t >= width && t <= maximo) ?? maximo
    return `${m[1]}${tamanho}.webp`
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
}
