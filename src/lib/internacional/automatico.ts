// Textos das páginas nos idiomas automáticos (/ja, /pl, /zh…, ver idiomas.ts): o dicionário e os textos longos do inglês,
// traduzidos pela Amazon Translate (traducao.ts) na primeira vez que alguém abre uma página no idioma. Nada é traduzido
// de antemão nem guardado no banco: as traduções ficam no cache do Next, com o texto em inglês como chave, então mudar
// um texto em ./dicionarios/en.ts ou ./conteudo/en.ts só refaz a tradução do que mudou.
//
// Os {marcadores} dos textos ("Up to {valor}") vão para a AWS como {0}, {1}… (números ela não traduz) e voltam com o
// nome; tradução que perde ou inventa um marcador é descartada e o texto fica em inglês. Dias da semana e meses vêm do
// próprio `Intl` do idioma, sem tradução.
import 'server-only'
import { cacheLife } from 'next/cache'
import { cache } from 'react'
import type { TipoImovel } from '@/lib/imoveis/tipos'
import type { Artigo, ConteudoIdioma } from './conteudo/tipos'
import conteudoEn from './conteudo/en'
import { preencher, type Dicionario } from './dicionario'
import en from './dicionarios/en'
import { DADOS_IDIOMA, type IdiomaAutomatico, type Moeda } from './idiomas'
import { traduzirDoIngles } from './traducao'

interface Folha {
  caminho: string
  texto: string
}

/** Os textos de um objeto, com o caminho de cada um ("inicio.busca.modos.1"). Funções e o que `pular` aceita ficam de fora. */
function folhas(valor: unknown, pular: (caminho: string) => boolean, caminho = '', saida: Folha[] = []): Folha[] {
  if (pular(caminho)) return saida
  if (typeof valor === 'string') saida.push({ caminho, texto: valor })
  else if (valor && typeof valor === 'object')
    for (const [chave, filho] of Object.entries(valor)) folhas(filho, pular, caminho ? `${caminho}.${chave}` : chave, saida)
  return saida
}

/** Cópia do objeto com cada texto trocado pelo do mapa (pelo caminho); funções e o resto ficam como estão. */
function reconstruir<T>(valor: T, mapa: Map<string, string>, caminho = ''): T {
  if (typeof valor === 'string') return (mapa.get(caminho) ?? valor) as T
  if (Array.isArray(valor)) return valor.map((filho, i) => reconstruir(filho, mapa, caminho ? `${caminho}.${i}` : String(i))) as T
  if (valor && typeof valor === 'object')
    return Object.fromEntries(
      Object.entries(valor).map(([chave, filho]) => [chave, reconstruir(filho, mapa, caminho ? `${caminho}.${chave}` : chave)]),
    ) as T
  return valor
}

function protegerMarcadores(texto: string) {
  const chaves: string[] = []
  const fonte = texto.replace(/\{(\w+)\}/g, (_, chave: string) => `{${chaves.push(chave) - 1}}`)
  return { fonte, chaves }
}

function devolverMarcadores(traduzido: string, chaves: string[]) {
  const achados = [...traduzido.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])).sort((a, b) => a - b)
  if (achados.length !== chaves.length || achados.some((n, i) => n !== i)) return null
  return traduzido.replace(/\{(\d+)\}/g, (_, n: string) => `{${chaves[Number(n)]}}`)
}

/** A AWS às vezes devolve palavra solta entre colchetes ("All" → "[すべて]"). */
const semColchetes = (traduzido: string, fonte: string) =>
  /^\[[^\]]*\]$/.test(traduzido) && !fonte.startsWith('[') ? traduzido.slice(1, -1) : traduzido

/** Rótulo que começa com maiúscula em inglês começa com maiúscula na tradução ("Real estate" → "недвижимость" → "Недвижимость"). */
function comMaiuscula(traduzido: string, fonte: string, locale: string) {
  if (!/^\p{Lu}/u.test(fonte) || !/^\p{Ll}/u.test(traduzido)) return traduzido
  return traduzido.charAt(0).toLocaleUpperCase(locale) + traduzido.slice(1)
}

/** Os textos em inglês que citam o dólar falam do euro nos idiomas em que o preço sai em euro. */
const naMoeda = (texto: string, moeda: Moeda) => (moeda === 'EUR' ? texto.replace(/US dollars/g, 'euros') : texto)

/**
 * Tradução de uma lista de textos. Completa, fica no cache até o próximo deploy; com falha (AWS fora do ar), a página
 * sai com esses textos em inglês e é refeita em minutos.
 */
async function traduzirLista(fontes: string[], idioma: IdiomaAutomatico): Promise<(string | null)[]> {
  'use cache'
  const traduzidos = await traduzirDoIngles(fontes, idioma)
  if (traduzidos.some((t, i) => t === null && fontes[i])) cacheLife('minutes')
  else cacheLife('max')
  return traduzidos
}

/** Traduz os textos do objeto (menos os que `pular` aceita), trocando a fonte de alguns por `fontes` (pelo caminho). */
async function traduzirObjeto<T>(
  base: T,
  idioma: IdiomaAutomatico,
  pular: (caminho: string) => boolean,
  fontes: Record<string, string> = {},
  extras: string[] = [],
) {
  const { moeda, locale } = DADOS_IDIOMA[idioma]
  const lista = folhas(base, pular)
  const protegidos = [...lista.map((f) => fontes[f.caminho] ?? f.texto), ...extras].map((t) => protegerMarcadores(naMoeda(t, moeda)))
  const traduzidos = await traduzirLista(
    protegidos.map((p) => p.fonte),
    idioma,
  )
  const finais = traduzidos.map((t, i) =>
    t === null ? null : devolverMarcadores(comMaiuscula(semColchetes(t, protegidos[i]!.fonte), protegidos[i]!.fonte, locale), protegidos[i]!.chaves),
  )
  // Sem tradução, o texto em inglês (a fonte, que nos títulos em duas partes é a frase inteira).
  const mapa = new Map(lista.map((f, i) => [f.caminho, finais[i] ?? naMoeda(fontes[f.caminho] ?? f.texto, moeda)]))
  return { objeto: reconstruir(base, mapa), extras: extras.map((e, j) => finais[lista.length + j] ?? e) }
}

// ——— Dicionário ———

const PULAR_DICIONARIO = (caminho: string) =>
  caminho === 'nav.portugues' ||
  TITULOS_EM_DUAS_PARTES.some(([, destaque]) => destaque === caminho) ||
  // Filtros dos atalhos do rodapé (cidade, tipo e situação são valores da URL, não texto).
  /^rodape\.buscas\.\d+\.(cidade|tipo|situacao)$/.test(caminho) ||
  // Vêm do Intl do idioma (abaixo).
  ['formato.meses', 'formato.mesesCurtos', 'visita.dias', 'visita.hora', 'formato.ate'].includes(caminho)

/**
 * Fontes em inglês mais claras que o texto da página para palavras soltas que a tradução automática erraria sem
 * contexto ("Properties" virava "atributos"; "From", "de onde").
 */
const FONTES_DICIONARIO: Record<string, string> = {
  'nav.imoveis': 'Real estate',
  'inicio.busca.modos.1': 'Ready to move in',
  'inicio.busca.nome': 'Listing name or code',
  'imovel.codigo': 'Property code',
  // Rótulo antes do valor: "From" sozinho vira "de onde" (e "Starting at" sai invertido em japonês e coreano).
  'imovel.precoAPartirDe': 'Starting price',
  'imovel.tipoRotulo': 'Property type',
  'imovel.pertoDe': 'Nearby',
  'imovel.investimento': 'Property price',
  'imovel.galeria.fechar': 'Close the photo gallery',
  'formato.banheirosCurto': 'bathrooms',
}

/**
 * Títulos com a parte final em destaque ("Your home in" + "Brazil."): traduzidos como uma frase só (em partes, a
 * gramática quebra: "в Бразилия" em vez de "в Бразилии"), e a última palavra da tradução vira o destaque. Em idioma
 * sem espaço entre as palavras (chinês, japonês), o título fica inteiro, sem destaque.
 */
const TITULOS_EM_DUAS_PARTES: [string, string][] = [
  ['inicio.titulo', 'inicio.tituloDestaque'],
  ['inicio.servicosTitulo', 'inicio.servicosTituloDestaque'],
  ['inicio.depoTitulo', 'inicio.depoTituloDestaque'],
]

function lerCaminho(objeto: unknown, caminho: string): unknown {
  return caminho.split('.').reduce<unknown>((o, chave) => (o as Record<string, unknown>)?.[chave], objeto)
}

function gravarCaminho(objeto: unknown, caminho: string, valor: unknown) {
  const chaves = caminho.split('.')
  const ultima = chaves.pop()!
  ;(lerCaminho(objeto, chaves.join('.')) as Record<string, unknown>)[ultima] = valor
}

/** Frases das funções do dicionário (título da ficha, texto das fotos), como modelos com marcadores. */
const MODELOS = {
  chamadaCom: '{tipo} with {quartos} in {bairro}, {cidade} – {uf}',
  chamadaSem: '{tipo} in {bairro}, {cidade} – {uf}',
  tituloSeo: '{nome}: {tipo} for sale in {bairro}, {cidade}, Brazil',
  descricaoSeoCom: '{nome}, {tipo} with {quartos} and {area} in {bairro}, {cidade}, Pernambuco, Brazil. {preco}.',
  descricaoSeoSem: '{nome}, {tipo} with {area} in {bairro}, {cidade}, Pernambuco, Brazil. {preco}.',
  altFoto: '{nome}, {tipo} in {bairro}, {cidade} – photo {n}',
}

/** O dicionário do idioma automático (uma montagem por requisição). */
export const dicionarioAutomatico = cache(async (idioma: IdiomaAutomatico): Promise<Dicionario> => {
  const { locale } = DADOS_IDIOMA[idioma]
  const chaves = Object.keys(MODELOS) as (keyof typeof MODELOS)[]
  const fontes = { ...FONTES_DICIONARIO }
  for (const [inicio, destaque] of TITULOS_EM_DUAS_PARTES) fontes[inicio] = `${lerCaminho(en, inicio)} ${lerCaminho(en, destaque)}`
  const { objeto: d, extras } = await traduzirObjeto(en, idioma, PULAR_DICIONARIO, fontes, Object.values(MODELOS))
  for (const [inicio, destaque] of TITULOS_EM_DUAS_PARTES) {
    const frase = String(lerCaminho(d, inicio))
    const espaco = frase.lastIndexOf(' ')
    gravarCaminho(d, inicio, espaco > 0 ? frase.slice(0, espaco) : frase)
    gravarCaminho(d, destaque, espaco > 0 ? frase.slice(espaco + 1) : '')
  }
  const modelo = Object.fromEntries(chaves.map((k, i) => [k, extras[i]!])) as Record<keyof typeof MODELOS, string>

  const tipo = d.imovel.tipo
  const minusculo = (t: TipoImovel) => tipo[t].toLocaleLowerCase(locale)
  d.imovel.chamada = ({ tipo: t, quartos, bairro, cidade, uf }) =>
    preencher(quartos ? modelo.chamadaCom : modelo.chamadaSem, { tipo: tipo[t], quartos: quartos ?? '', bairro, cidade, uf })
  d.imovel.tituloSeo = ({ nome, tipo: t, bairro, cidade }) => preencher(modelo.tituloSeo, { nome, tipo: minusculo(t), bairro, cidade })
  d.imovel.descricaoSeo = ({ nome, tipo: t, quartos, area, bairro, cidade, preco }) =>
    preencher(quartos ? modelo.descricaoSeoCom : modelo.descricaoSeoSem, { nome, tipo: minusculo(t), quartos: quartos ?? '', area, bairro, cidade, preco })
  d.imovel.altFoto = ({ nome, tipo: t, bairro, cidade, posicao }) =>
    preencher(modelo.altFoto, { nome, tipo: minusculo(t), bairro, cidade, n: posicao + 1 })

  // Segunda a domingo (1º/1/2024 foi uma segunda) e os meses, no formato do idioma.
  const dia = (i: number, weekday: 'short' | 'long') =>
    new Intl.DateTimeFormat(locale, { weekday, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i)))
  const mes = (i: number, month: 'short' | 'long') =>
    new Intl.DateTimeFormat(locale, { month, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, i, 1)))
  d.visita.dias = Array.from({ length: 7 }, (_, i) => [dia(i, 'short'), dia(i, 'long')])
  d.formato.meses = Array.from({ length: 12 }, (_, i) => mes(i, 'long'))
  d.formato.mesesCurtos = Array.from({ length: 12 }, (_, i) => mes(i, 'short'))
  d.formato.ate = '–'
  d.visita.hora = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2024, 0, 1, 8)))
    .replace(/0?8/, '{h}')
  return d
})

// ——— Textos longos (guia de compra, região, política de privacidade) ———

export const artigoAutomatico = cache(async (idioma: IdiomaAutomatico, secao: keyof ConteudoIdioma): Promise<Artigo> => {
  // O tipo de cada bloco ("lista", "tabela"…) não é texto.
  const { objeto } = await traduzirObjeto(conteudoEn[secao], idioma, (c) => /(^|\.)tipo$/.test(c))
  return objeto
})
