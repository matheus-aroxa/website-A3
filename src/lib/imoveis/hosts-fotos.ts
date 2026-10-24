// Origens de onde o site aceita fotos (next/image só otimiza imagens desses hosts).
// Usado no next.config.ts e na validação das fotos do painel administrativo.
export const HOST_S3_FOTOS = 'a3-imoveis-fotos.s3.sa-east-1.amazonaws.com'

export const HOSTS_FOTOS = [
  HOST_S3_FOTOS,
  'cdn.sistemasupremo.com.br',
  'ss.cloudadmin.com.br',
  'arquivos.sistemasupremo.com.br',
]

/** Nome dos arquivos enviados pelo painel (servidos pelo próprio site em /fotos/). */
export const NOME_FOTO_ENVIADA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/

export function fotoPermitida(url: string) {
  if (url.startsWith('/fotos/')) return NOME_FOTO_ENVIADA.test(url.slice('/fotos/'.length))
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && HOSTS_FOTOS.includes(u.hostname)
  } catch {
    return false
  }
}
