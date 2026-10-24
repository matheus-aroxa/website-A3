// Dados estruturados (schema.org / JSON-LD) para o Google entender a imobiliária e os anúncios.
import { fotosComCapaPrimeiro } from './imoveis/busca'
import { formatarArea, precoPlausivel, rotuloTipo } from './imoveis/formato'
import type { Migalha } from './imoveis/rotas'
import { urlImovel } from './imoveis/rotas'
import type { Imovel, ImovelResumo } from './imoveis/tipos'
import { site, urlAbsoluta } from './site'

const ID_ORGANIZACAO = `${site.url}/#imobiliaria`

export function schemaImobiliaria() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        '@id': ID_ORGANIZACAO,
        name: site.nome,
        alternateName: site.nomeCurto,
        url: site.url,
        logo: urlAbsoluta('/icon.png'),
        image: urlAbsoluta('/opengraph-image.jpg'),
        description: site.descricao,
        telephone: site.telefone,
        email: site.email,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: site.telefone,
          email: site.email,
          areaServed: 'BR',
          availableLanguage: 'pt-BR',
        },
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.nome}, ${site.endereco.exibicao}`)}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.endereco.logradouro,
          addressLocality: site.endereco.cidade,
          addressRegion: site.endereco.uf,
          postalCode: site.endereco.cep,
          addressCountry: site.endereco.pais,
        },
        areaServed: site.areaAtendida.map((nome) => ({ '@type': 'City', name: nome })),
        identifier: { '@type': 'PropertyValue', propertyID: 'CRECI', value: '18568PJ' },
        sameAs: [site.instagram],
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#site`,
        url: site.url,
        name: site.nome,
        alternateName: site.nomeCurto,
        inLanguage: 'pt-BR',
        publisher: { '@id': ID_ORGANIZACAO },
      },
    ],
  }
}

export function schemaMigalhas(migalhas: Migalha[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migalhas.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.nome,
      item: urlAbsoluta(m.href),
    })),
  }
}

/** Página de listagem (busca por local, Minha Casa Minha Vida): a coleção de anúncios que ela reúne. */
export function schemaColecao({ nome, descricao, caminho }: { nome: string; descricao: string; caminho: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${urlAbsoluta(caminho)}#colecao`,
    url: urlAbsoluta(caminho),
    name: nome,
    description: descricao,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${site.url}/#site` },
    publisher: { '@id': ID_ORGANIZACAO },
  }
}

export function schemaListaImoveis(itens: ImovelResumo[], posicaoInicial: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: itens.map((im, i) => ({
      '@type': 'ListItem',
      position: posicaoInicial + i,
      url: urlAbsoluta(urlImovel(im.slug)),
      name: im.nome,
    })),
  }
}

const TIPO_SCHEMA = { apartamento: 'Apartment', 'casa-condominio': 'SingleFamilyResidence', terreno: 'Place' } as const

export function schemaAnuncio(im: Imovel) {
  const url = urlAbsoluta(urlImovel(im.slug))
  const residencia = {
    '@type': TIPO_SCHEMA[im.tipo],
    name: im.nome,
    description: `${rotuloTipo[im.tipo]} com ${formatarArea(im.area)} de área privativa`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: im.local.logradouro,
      addressLocality: im.local.cidade,
      addressRegion: im.local.uf,
      addressCountry: 'BR',
    },
    ...(im.local.geo && { geo: { '@type': 'GeoCoordinates', latitude: im.local.geo.lat, longitude: im.local.geo.lng } }),
    ...(im.tipo !== 'terreno' && {
      numberOfBedrooms: im.quartos.max,
      numberOfBathroomsTotal: im.banheiros.max,
      floorSize: { '@type': 'QuantitativeValue', minValue: im.area.min, maxValue: im.area.max, unitCode: 'MTK' },
      amenityFeature: im.lazer.map((nome) => ({ '@type': 'LocationFeatureSpecification', name: nome, value: true })),
    }),
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${url}#anuncio`,
    url,
    name: im.nome,
    description: im.descricao.join(' '),
    datePosted: im.publicadoEm,
    dateModified: im.atualizadoEm,
    image: fotosComCapaPrimeiro(im).map((f) => urlAbsoluta(f.src)),
    identifier: im.codigo,
    provider: { '@id': ID_ORGANIZACAO },
    about: residencia,
    // Preço absurdo (erro de cadastro) fica de fora: um valor errado nos dados estruturados desacredita o anúncio.
    ...(precoPlausivel(im.finalidade, im.preco) && {
      offers: {
        '@type': 'Offer',
        url,
        price: im.preco,
        priceCurrency: 'BRL',
        businessFunction: im.finalidade === 'aluguel' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
        availability: 'https://schema.org/InStock',
        seller: { '@id': ID_ORGANIZACAO },
        ...(im.finalidade === 'aluguel' && {
          priceSpecification: { '@type': 'UnitPriceSpecification', price: im.preco, priceCurrency: 'BRL', unitCode: 'MON' },
        }),
      },
    }),
  }
}
