import type { Filtros } from './filtros'
import type { IndiceImovel } from './rotas'
import type { Foto, Imovel } from './tipos'

/** Se o imóvel entra na busca de um caminho (categoria, tipo, cidade e bairro): usado no sitemap. */
export function atendeRota(im: IndiceImovel, f: Filtros) {
  if (f.categoria !== 'todos' && im.finalidade !== f.categoria) return false
  if (f.situacoes.length && !f.situacoes.includes(im.situacao)) return false
  if (f.tipos.length && !f.tipos.includes(im.tipo)) return false
  if (f.cidade && im.local.cidadeSlug !== f.cidade) return false
  if (f.bairro && im.local.bairroSlug !== f.bairro) return false
  return true
}

/** Fotos do imóvel com a capa na frente (as demais seguem na ordem da galeria). */
export function fotosComCapaPrimeiro(im: Pick<Imovel, 'fotos' | 'capa'>): Foto[] {
  const src = im.capa?.src
  const capa = src ? im.fotos.find((f) => f.src === src) : undefined
  return capa ? [capa, ...im.fotos.filter((f) => f !== capa)] : im.fotos
}
