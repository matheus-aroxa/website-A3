// Idiomas da área internacional: o site em português continua na raiz, com os endereços de sempre.
//
// Dois grupos (docs/area-internacional.md):
// - Revisados (/en, /it, /es, /fr, /de): textos escritos à mão (./dicionarios, ./conteudo), endereços traduzidos (o que a
//   pessoa digita no Google), indexados, com hreflang e sitemap.
// - Automáticos (/ja, /pl, /zh…): os textos da página são os do inglês traduzidos pela Amazon Translate no primeiro
//   acesso (./automatico.ts), com os endereços do inglês. Não entram no Google (noindex, fora do sitemap e do hreflang)
//   e só existem com o tradutor ligado (TRADUTOR=aws). Para pôr mais um, basta acrescentá-lo abaixo.

export const IDIOMAS_REVISADOS = ['en', 'it', 'es', 'fr', 'de'] as const
export type IdiomaRevisado = (typeof IDIOMAS_REVISADOS)[number]

export const IDIOMAS_AUTOMATICOS = [
  'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'hu', 'ro', 'el', 'ru', 'uk', 'tr', 'zh', 'zh-tw', 'ja', 'ko', 'hi', 'id', 'vi', 'th',
] as const
export type IdiomaAutomatico = (typeof IDIOMAS_AUTOMATICOS)[number]

export const IDIOMAS = [...IDIOMAS_REVISADOS, ...IDIOMAS_AUTOMATICOS] as const
export type Idioma = (typeof IDIOMAS)[number]

/** "en|it|…|zh-tw", para as expressões regulares que reconhecem endereços da área internacional (relatórios, coleta). */
export const PADRAO_IDIOMAS = IDIOMAS.map((i) => i.replace('-', '\\-')).join('|')

export function ehIdioma(valor: string): valor is Idioma {
  return (IDIOMAS as readonly string[]).includes(valor)
}

export function ehRevisado(idioma: string): idioma is IdiomaRevisado {
  return (IDIOMAS_REVISADOS as readonly string[]).includes(idioma)
}

/** Os idiomas automáticos dependem do tradutor (sem ele, a página sairia em inglês com o nome de outro idioma). */
export const tradutorAtivo = () => (process.env.TRADUTOR ?? '').trim().toLowerCase() === 'aws'

/** Idiomas que o site oferece agora: os revisados sempre, os automáticos só com o tradutor ligado. */
export const idiomasDisponiveis = (): readonly Idioma[] => (tradutorAtivo() ? IDIOMAS : IDIOMAS_REVISADOS)

export function idiomaDisponivel(valor: string): valor is Idioma {
  return ehRevisado(valor) || (tradutorAtivo() && ehIdioma(valor))
}

export type Moeda = 'USD' | 'EUR'

export interface DadosIdioma {
  /** Nome do idioma nele mesmo, para o seletor ("Italiano", "Deutsch"). */
  nome: string
  /** Nome em português, para o painel e as mensagens que chegam à A3 ("italiano"). */
  nomePortugues: string
  /** `<html lang>` e `hreflang`. */
  lang: string
  /** Código do idioma na Amazon Translate. */
  aws: string
  /** Locale de `Intl` (números, moedas, datas). */
  locale: string
  /** `og:locale`. */
  ogLocale: string
  /** Moeda do preço (dólar ou euro, convertido pela PTAX do dia). */
  moeda: Moeda
  /** Segmentos dos endereços. Os imóveis usam o mesmo slug do site em português (é o nome do empreendimento). */
  caminhos: { imoveis: string; guia: string; regiao: string; privacidade: string }
}

const DADOS_REVISADOS: Record<IdiomaRevisado, DadosIdioma> = {
  en: {
    nome: 'English',
    nomePortugues: 'inglês',
    lang: 'en',
    aws: 'en',
    locale: 'en-US',
    ogLocale: 'en_US',
    moeda: 'USD',
    caminhos: { imoveis: 'properties', guia: 'buying-property-in-brazil', regiao: 'recife-and-pernambuco', privacidade: 'privacy-policy' },
  },
  it: {
    nome: 'Italiano',
    nomePortugues: 'italiano',
    lang: 'it',
    aws: 'it',
    locale: 'it-IT',
    ogLocale: 'it_IT',
    moeda: 'EUR',
    caminhos: { imoveis: 'immobili', guia: 'comprare-casa-in-brasile', regiao: 'recife-e-pernambuco', privacidade: 'informativa-privacy' },
  },
  // Espanhol: o público maior é o da Argentina, do Chile e do Uruguai, que pensa imóvel em dólar.
  es: {
    nome: 'Español',
    nomePortugues: 'espanhol',
    lang: 'es',
    aws: 'es',
    locale: 'es-ES',
    ogLocale: 'es_ES',
    moeda: 'USD',
    caminhos: { imoveis: 'inmuebles', guia: 'comprar-inmueble-en-brasil', regiao: 'recife-y-pernambuco', privacidade: 'politica-de-privacidad' },
  },
  fr: {
    nome: 'Français',
    nomePortugues: 'francês',
    lang: 'fr',
    aws: 'fr',
    locale: 'fr-FR',
    ogLocale: 'fr_FR',
    moeda: 'EUR',
    caminhos: { imoveis: 'biens', guia: 'acheter-un-bien-au-bresil', regiao: 'recife-et-pernambouc', privacidade: 'politique-de-confidentialite' },
  },
  de: {
    nome: 'Deutsch',
    nomePortugues: 'alemão',
    lang: 'de',
    aws: 'de',
    locale: 'de-DE',
    ogLocale: 'de_DE',
    moeda: 'EUR',
    caminhos: { imoveis: 'immobilien', guia: 'immobilie-in-brasilien-kaufen', regiao: 'recife-und-pernambuco', privacidade: 'datenschutz' },
  },
}

/** Endereços dos idiomas automáticos: os do inglês (não vão para o Google, então não precisam estar no idioma). */
const CAMINHOS_AUTOMATICOS = DADOS_REVISADOS.en.caminhos

// [código, nome no idioma, nome em português, locale, moeda, código na AWS]. Euro para quem está na Europa (a moeda que o
// comprador europeu usa para comparar, mesmo fora da zona do euro); dólar para os demais.
const AUTOMATICOS: [IdiomaAutomatico, string, string, string, Moeda, string][] = [
  ['nl', 'Nederlands', 'holandês', 'nl-NL', 'EUR', 'nl'],
  ['sv', 'Svenska', 'sueco', 'sv-SE', 'EUR', 'sv'],
  ['no', 'Norsk', 'norueguês', 'nb-NO', 'EUR', 'no'],
  ['da', 'Dansk', 'dinamarquês', 'da-DK', 'EUR', 'da'],
  ['fi', 'Suomi', 'finlandês', 'fi-FI', 'EUR', 'fi'],
  ['pl', 'Polski', 'polonês', 'pl-PL', 'EUR', 'pl'],
  ['cs', 'Čeština', 'tcheco', 'cs-CZ', 'EUR', 'cs'],
  ['hu', 'Magyar', 'húngaro', 'hu-HU', 'EUR', 'hu'],
  ['ro', 'Română', 'romeno', 'ro-RO', 'EUR', 'ro'],
  ['el', 'Ελληνικά', 'grego', 'el-GR', 'EUR', 'el'],
  ['ru', 'Русский', 'russo', 'ru-RU', 'USD', 'ru'],
  ['uk', 'Українська', 'ucraniano', 'uk-UA', 'USD', 'uk'],
  ['tr', 'Türkçe', 'turco', 'tr-TR', 'USD', 'tr'],
  ['zh', '简体中文', 'chinês simplificado', 'zh-CN', 'USD', 'zh'],
  ['zh-tw', '繁體中文', 'chinês tradicional', 'zh-TW', 'USD', 'zh-TW'],
  ['ja', '日本語', 'japonês', 'ja-JP', 'USD', 'ja'],
  ['ko', '한국어', 'coreano', 'ko-KR', 'USD', 'ko'],
  ['hi', 'हिन्दी', 'hindi', 'hi-IN', 'USD', 'hi'],
  ['id', 'Bahasa Indonesia', 'indonésio', 'id-ID', 'USD', 'id'],
  ['vi', 'Tiếng Việt', 'vietnamita', 'vi-VN', 'USD', 'vi'],
  ['th', 'ไทย', 'tailandês', 'th-TH', 'USD', 'th'],
]

export const DADOS_IDIOMA: Record<Idioma, DadosIdioma> = {
  ...DADOS_REVISADOS,
  ...(Object.fromEntries(
    AUTOMATICOS.map(([codigo, nome, nomePortugues, locale, moeda, aws]) => [
      codigo,
      { nome, nomePortugues, lang: locale.startsWith('zh') ? locale : locale.split('-')[0]!, aws, locale, ogLocale: locale.replace('-', '_'), moeda, caminhos: CAMINHOS_AUTOMATICOS },
    ]),
  ) as Record<IdiomaAutomatico, DadosIdioma>),
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
  // Só os revisados: os automáticos não vão para o Google.
  const idiomas: Record<string, string> = Object.fromEntries(IDIOMAS_REVISADOS.map((i) => [i, caminho(i)]))
  if (portugues) idiomas['pt-BR'] = portugues
  // Quem busca num idioma sem versão própria cai na versão em inglês.
  idiomas['x-default'] = caminho('en')
  return idiomas
}

/** Endereço da página em cada idioma e no site em português, para o seletor de idioma. */
export function versoes(caminho: (idioma: Idioma) => string, portugues = '/') {
  return { ...(Object.fromEntries(idiomasDisponiveis().map((i) => [i, caminho(i)])) as Partial<Record<Idioma, string>>), pt: portugues }
}
