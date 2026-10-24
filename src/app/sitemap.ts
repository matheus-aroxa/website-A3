import type { MetadataRoute } from 'next'
import { listarIndiceComFotos, listarPaginasDeBusca } from '@/lib/imoveis/repositorio'
import { urlImovel } from '@/lib/imoveis/rotas'
import { urlAbsoluta } from '@/lib/site'

const maisRecente = (datas: string[]) => datas.sort().at(-1)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [imoveis, paginas] = await Promise.all([listarIndiceComFotos(), listarPaginasDeBusca()])

  // Só a página principal de cada conjunto de imóveis: as duplicatas apontam o canonical para ela e ficam de fora,
  // e as buscas com um imóvel só (noindex) também (ver lib/imoveis/paginas.ts).
  const buscas = paginas
    .filter((p) => p.indexavel)
    .map((p) => ({
      url: urlAbsoluta(p.caminho),
      lastModified: p.atualizadoEm,
      changeFrequency: 'daily' as const,
      priority: p.rota.bairro ? 0.6 : p.rota.cidade || p.rota.tipo ? 0.7 : 0.8,
    }))

  return [
    { url: urlAbsoluta('/'), lastModified: maisRecente(imoveis.map((im) => im.atualizadoEm)), changeFrequency: 'daily', priority: 1 },
    ...buscas,
    ...imoveis.map((im) => ({
      url: urlAbsoluta(urlImovel(im.slug)),
      lastModified: im.atualizadoEm,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      images: (im.fotos ?? []).map(urlAbsoluta),
    })),
    { url: urlAbsoluta('/politica-de-privacidade'), changeFrequency: 'yearly', priority: 0.2 },
  ]
}
