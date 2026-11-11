// Cliente da "API do site" da Viniun (CRM da A3). Documentação: https://novo.viniun.com.br/docs/site-api
// (OpenAPI em https://novo.viniun.com.br/api/v1/site-api/openapi.json). Só leitura: a chave tem imoveis:ler e site:ler.
// Limite da Viniun: 600 chamadas por minuto por chave. O ritmo daqui fica abaixo disso, e um 429 espera o Retry-After.
import 'server-only'

const URL_PADRAO = 'https://novo.viniun.com.br/api/v1/site-api'
/** Intervalo mínimo entre duas chamadas do mesmo processo (~9 por segundo, 545 por minuto: abaixo dos 600 da Viniun). */
const INTERVALO_MS = 110
const TENTATIVAS = 4
const TEMPO_LIMITE_MS = 20_000

// ---------- Formato das respostas (só os campos que o site usa) ----------

/** Um imóvel na listagem (GET /imoveis). */
export interface CardViniun {
  id: number
  codigo: string | null
  slug: string
  titulo: string
  tipo_slug: string | null
  finalidade_slug: string | null
  cidade: string | null
  uf: string | null
  bairro: string | null
  dormitorios: number | null
  suites: number | null
  banheiros: number | null
  vagas: number | null
  /** m² (útil; sem útil, a total). */
  area: number | null
  /** Venda, ou aluguel quando a finalidade é locação. */
  valor: number | null
  foto: string | null
  foto_tamanhos: { thumb: string | null; media: string | null; grande: string | null } | null
  destaque: boolean
  lancamento: boolean
  data_entrega: string | null
  atualizado_em: string | null
}

export interface SlugViniun {
  slug: string
  codigo: string | null
  atualizado_em: string | null
}

export interface PaginaViniun<T> {
  data: T[]
  meta: { total: number; pagina: number; ultima_pagina: number }
}

export interface FotoViniun {
  thumb: string | null
  media: string | null
  grande: string | null
  original: string | null
  largura: number | null
  altura: number | null
  tipo: string
  legenda: string | null
  capa: boolean
}

export interface ImovelViniun {
  id: number
  codigo: string | null
  slug: string
  titulo: string
  descricao: string | null
  tipo: { slug: string; nome: string } | null
  finalidade: { slug: string; nome: string } | null
  situacao: string | null
  destaque: boolean
  lancamento: boolean
  data_entrega: string | null
  localizacao: {
    cidade: string | null
    uf: string | null
    bairro: string | null
    logradouro: string | null
    numero: string | null
    endereco_completo: boolean
    coordenadas: { lat: number; lng: number; aproximado: boolean } | null
  }
  dormitorios: number | null
  suites: number | null
  banheiros: number | null
  vagas: number | null
  areas: { total: number | null; privativa: number | null; util: number | null }
  valores: { venda: number | null; locacao: number | null; promocao: number | null }
  caracteristicas: string[]
  proximidades: string[]
  fotos: FotoViniun[]
  construtora: { nome: string; slug: string | null } | null
  publicado_em: string | null
  atualizado_em: string | null
}

// ---------- Chamadas ----------

export class ErroViniun extends Error {
  constructor(
    mensagem: string,
    readonly status?: number,
  ) {
    super(mensagem)
    this.name = 'ErroViniun'
  }
}

function configuracao() {
  const chave = process.env.VINIUN_API_KEY?.trim()
  if (!chave) throw new ErroViniun('VINIUN_API_KEY não definida (veja docs/integracao-viniun.md).')
  return { chave, base: (process.env.VINIUN_API_URL?.trim() || URL_PADRAO).replace(/\/$/, '') }
}

// Fila do processo: cada chamada sai no mínimo INTERVALO_MS depois da anterior.
let proximaVez = 0
async function aguardarVez() {
  const agora = Date.now()
  const minha = Math.max(agora, proximaVez)
  proximaVez = minha + INTERVALO_MS
  if (minha > agora) await new Promise((r) => setTimeout(r, minha - agora))
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** GET na API do site. `null` quando a Viniun responde 404 (imóvel fora do ar). */
export async function lerViniun<T>(caminho: string, parametros: Record<string, string | number | boolean> = {}): Promise<T | null> {
  const { chave, base } = configuracao()
  const url = new URL(`${base}${caminho}`)
  for (const [k, v] of Object.entries(parametros)) url.searchParams.set(k, String(v))

  for (let tentativa = 1; ; tentativa++) {
    await aguardarVez()
    let resposta: Response
    try {
      resposta = await fetch(url, {
        headers: { 'X-Api-Key': chave, Accept: 'application/json' },
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        cache: 'no-store',
      })
    } catch (erro) {
      if (tentativa < TENTATIVAS) {
        await esperar(1000 * tentativa)
        continue
      }
      throw new ErroViniun(`Viniun fora do ar (${url.pathname}): ${(erro as Error).message}`)
    }
    if (resposta.ok) return (await resposta.json()) as T
    if (resposta.status === 404) return null
    if ((resposta.status === 429 || resposta.status >= 500) && tentativa < TENTATIVAS) {
      const retry = Number(resposta.headers.get('retry-after'))
      await esperar(Number.isFinite(retry) && retry > 0 ? retry * 1000 : 2000 * tentativa)
      continue
    }
    throw new ErroViniun(`Viniun respondeu ${resposta.status} em ${url.pathname}`, resposta.status)
  }
}

/** Todas as páginas de uma listagem (até 50 itens por página). */
export async function lerTodasAsPaginas<T>(caminho: string, parametros: Record<string, string | number | boolean> = {}): Promise<T[]> {
  const itens: T[] = []
  for (let pagina = 1; ; pagina++) {
    const resposta = await lerViniun<PaginaViniun<T>>(caminho, { ...parametros, por_pagina: 50, page: pagina })
    if (!resposta) throw new ErroViniun(`Viniun respondeu 404 em ${caminho}`)
    itens.push(...resposta.data)
    if (pagina >= resposta.meta.ultima_pagina || resposta.data.length === 0) return itens
  }
}

/** Roda `trabalho` em cada item, `simultaneos` de cada vez (o ritmo das chamadas continua limitado pela fila acima). */
export async function emLotes<T, R>(itens: T[], simultaneos: number, trabalho: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(itens.length)
  let proximo = 0
  const operario = async () => {
    while (proximo < itens.length) {
      const i = proximo++
      resultados[i] = await trabalho(itens[i]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(simultaneos, itens.length) }, operario))
  return resultados
}
