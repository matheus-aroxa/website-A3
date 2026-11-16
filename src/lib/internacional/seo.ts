// Dados estruturados (JSON-LD) da ficha do imóvel na área internacional: os mesmos do site em português (lib/seo.ts),
// com os textos no idioma e o endereço da página internacional.
import { precoPlausivel } from '@/lib/imoveis/formato'
import { ID_ORGANIZACAO, TIPO_SCHEMA } from '@/lib/seo'
import { urlAbsoluta } from '@/lib/site'
import { fotosDoImovel, type ImovelInternacional } from './catalogo'
import { urlImovelInternacional, type Idioma } from './idiomas'

export function schemaAnuncioInternacional(im: ImovelInternacional, idioma: Idioma) {
  const url = urlAbsoluta(urlImovelInternacional(idioma, im.slug))
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${url}#anuncio`,
    url,
    name: im.nome,
    description: im.descricaoOriginal ? im.chamada : im.descricao.join(' '),
    inLanguage: idioma,
    datePosted: im.publicadoEm,
    dateModified: im.atualizadoEm,
    image: fotosDoImovel(im).map((f) => urlAbsoluta(f.src)),
    identifier: im.codigo,
    provider: { '@id': ID_ORGANIZACAO },
    about: {
      '@type': TIPO_SCHEMA[im.tipo],
      name: im.nome,
      description: im.chamada,
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
    },
    ...(precoPlausivel(im.finalidade, im.preco) && {
      offers: {
        '@type': 'Offer',
        url,
        price: im.preco,
        priceCurrency: 'BRL',
        businessFunction: 'http://purl.org/goodrelations/v1#Sell',
        availability: 'https://schema.org/InStock',
        seller: { '@id': ID_ORGANIZACAO },
      },
    }),
  }
}
