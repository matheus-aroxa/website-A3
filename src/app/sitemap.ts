import type { MetadataRoute } from 'next'
import { listarIndiceComFotos, listarPaginasDeBusca } from '@/lib/imoveis/repositorio'
import { urlImovel } from '@/lib/imoveis/rotas'
import { listarImoveisInternacionais } from '@/lib/internacional/catalogo'
import { IDIOMAS, alternativas, urlImovelInternacional, urlInicio, urlSecao, type Idioma, type Secao } from '@/lib/internacional/idiomas'
import { urlAbsoluta } from '@/lib/site'

/** Cada página da área internacional entra uma vez por idioma, com as outras versões ligadas (hreflang). */
function emTodosOsIdiomas(caminho: (idioma: Idioma) => string, extra: Omit<MetadataRoute.Sitemap[number], 'url'>, portugues?: string) {
  const languages = Object.fromEntries(Object.entries(alternativas(caminho, portugues)).map(([lang, url]) => [lang, urlAbsoluta(url)]))
  return IDIOMAS.map((idioma) => ({ ...extra, url: urlAbsoluta(caminho(idioma)), alternates: { languages } }))
}

const maisRecente = (datas: string[]) => datas.sort().at(-1)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [imoveis, paginas, internacionais] = await Promise.all([listarIndiceComFotos(), listarPaginasDeBusca(), listarImoveisInternacionais()])
  const noRecorte = new Set(internacionais.map((im) => im.slug))

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
    // Área internacional (/en, /it, /es, /fr, /de).
    ...emTodosOsIdiomas(urlInicio, { changeFrequency: 'daily', priority: 0.9 }),
    ...(['imoveis', 'guia', 'regiao'] as Secao[]).flatMap((secao) =>
      emTodosOsIdiomas((i) => urlSecao(i, secao), { changeFrequency: secao === 'imoveis' ? 'daily' : 'monthly', priority: 0.8 }),
    ),
    ...emTodosOsIdiomas((i) => urlSecao(i, 'privacidade'), { changeFrequency: 'yearly', priority: 0.2 }, '/politica-de-privacidade'),
    ...imoveis
      .filter((im) => noRecorte.has(im.slug))
      .flatMap((im) =>
        emTodosOsIdiomas(
          (i) => urlImovelInternacional(i, im.slug),
          { lastModified: im.atualizadoEm, changeFrequency: 'weekly', priority: 0.7, images: (im.fotos ?? []).map(urlAbsoluta) },
          urlImovel(im.slug),
        ),
      ),
  ]
}
