// Idiomas da área internacional (/en, /it, /es, /fr, /de): o site em português continua na raiz, com os endereços de sempre.
// Cada idioma tem os próprios endereços (traduzidos, que é o que a pessoa digita no Google), a moeda do valor
// aproximado e o locale das datas e números.

export const IDIOMAS = ['en', 'it', 'es', 'fr', 'de'] as const
export type Idioma = (typeof IDIOMAS)[number]

export function ehIdioma(valor: string): valor is Idioma {
  return (IDIOMAS as readonly string[]).includes(valor)
}

export type Moeda = 'USD' | 'EUR'

export interface DadosIdioma {
  /** Nome do idioma nele mesmo, para o seletor ("Italiano", "Deutsch"). */
  nome: string
  /** Locale de `Intl` (números, moedas, datas). */
  locale: string
  /** `og:locale`. */
  ogLocale: string
  /** Moeda do valor aproximado ao lado do preço em reais. */
  moeda: Moeda
  /** Segmentos dos endereços. Os imóveis usam o mesmo slug do site em português (é o nome do empreendimento). */
  caminhos: { imoveis: string; guia: string; regiao: string; privacidade: string }
}

export const DADOS_IDIOMA: Record<Idioma, DadosIdioma> = {
  en: {
    nome: 'English',
    locale: 'en-US',
    ogLocale: 'en_US',
    moeda: 'USD',
    caminhos: { imoveis: 'properties', guia: 'buying-property-in-brazil', regiao: 'recife-and-pernambuco', privacidade: 'privacy-policy' },
  },
  it: {
    nome: 'Italiano',
    locale: 'it-IT',
    ogLocale: 'it_IT',
    moeda: 'EUR',
    caminhos: { imoveis: 'immobili', guia: 'comprare-casa-in-brasile', regiao: 'recife-e-pernambuco', privacidade: 'informativa-privacy' },
  },
  // Espanhol: o público maior é o da Argentina, do Chile e do Uruguai, que pensa imóvel em dólar.
  es: {
    nome: 'Español',
    locale: 'es-ES',
    ogLocale: 'es_ES',
    moeda: 'USD',
    caminhos: { imoveis: 'inmuebles', guia: 'comprar-inmueble-en-brasil', regiao: 'recife-y-pernambuco', privacidade: 'politica-de-privacidad' },
  },
  fr: {
    nome: 'Français',
    locale: 'fr-FR',
    ogLocale: 'fr_FR',
    moeda: 'EUR',
    caminhos: { imoveis: 'biens', guia: 'acheter-un-bien-au-bresil', regiao: 'recife-et-pernambouc', privacidade: 'politique-de-confidentialite' },
  },
  de: {
    nome: 'Deutsch',
    locale: 'de-DE',
    ogLocale: 'de_DE',
    moeda: 'EUR',
    caminhos: { imoveis: 'immobilien', guia: 'immobilie-in-brasilien-kaufen', regiao: 'recife-und-pernambuco', privacidade: 'datenschutz' },
  },
}

export type Secao = keyof DadosIdioma['caminhos']

/** Qual seção um segmento de endereço representa naquele idioma ("immobili" em italiano = imóveis). */
export function secaoDoCaminho(idioma: Idioma, segmento: string): Secao | undefined {
  const caminhos = DADOS_IDIOMA[idioma].caminhos
  return (Object.keys(caminhos) as Secao[]).find((s) => caminhos[s] === segmento)
}

export const urlInicio = (idioma: Idioma) => `/${idioma}`
export const urlSecao = (idioma: Idioma, secao: Secao) => `/${idioma}/${DADOS_IDIOMA[idioma].caminhos[secao]}`
export const urlImovelInternacional = (idioma: Idioma, slug: string) => `${urlSecao(idioma, 'imoveis')}/${slug}`

/**
 * As versões de uma mesma página em todos os idiomas, para o `hreflang` (o Google mostra a de cada idioma a quem busca
 * nele). `portugues` liga a página em português equivalente, quando existe (a ficha do imóvel existe nos dois sites).
 */
export function alternativas(caminho: (idioma: Idioma) => string, portugues?: string) {
  const idiomas: Record<string, string> = Object.fromEntries(IDIOMAS.map((i) => [i, caminho(i)]))
  if (portugues) idiomas['pt-BR'] = portugues
  // Quem busca num idioma sem versão própria cai na versão em inglês.
  idiomas['x-default'] = caminho('en')
  return idiomas
}

/** Endereço da página em cada idioma e no site em português, para o seletor de idioma. */
export function versoes(caminho: (idioma: Idioma) => string, portugues = '/') {
  return { ...(Object.fromEntries(IDIOMAS.map((i) => [i, caminho(i)])) as Record<Idioma, string>), pt: portugues }
}
