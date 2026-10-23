import type { MetadataRoute } from 'next'
import { atendeRota } from '@/lib/imoveis/busca'
import { caminhoDaRota, lerFiltros } from '@/lib/imoveis/filtros'
import { listarIndiceComFotos } from '@/lib/imoveis/repositorio'
import { combinacoesDeRota, urlImovel } from '@/lib/imoveis/rotas'
import { urlAbsoluta } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const imoveis = await listarIndiceComFotos()
  const maisRecente = imoveis.map((im) => im.atualizadoEm).sort().at(-1)

  const buscas = combinacoesDeRota(imoveis).map((rota) => {
    const { filtros } = lerFiltros(rota, {})
    const encontrados = imoveis.filter((im) => atendeRota(im, filtros))
    return {
      url: urlAbsoluta(caminhoDaRota(rota)),
      lastModified: encontrados.map((im) => im.atualizadoEm).sort().at(-1),
      changeFrequency: 'daily' as const,
      priority: rota.bairro ? 0.6 : rota.cidade || rota.tipo ? 0.7 : 0.8,
    }
  })

  return [
    { url: urlAbsoluta('/'), lastModified: maisRecente, changeFrequency: 'daily', priority: 1 },
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
