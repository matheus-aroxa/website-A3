// Quais páginas de busca existem, o que cada uma mostra e qual delas o Google deve indexar.
//
// O caminho da busca (categoria × tipo × cidade × bairro) gera várias URLs que mostram exatamente os mesmos imóveis:
// se o Janga só tem apartamentos à venda, /imoveis/paulista/janga e /imoveis/venda/apartamentos/paulista/janga são a mesma
// lista. Para o Google isso é conteúdo duplicado. Aqui cada conjunto de imóveis escolhe uma página principal (a mais
// específica) e as outras apontam o canonical para ela. Conjuntos com um imóvel só ficam fora do índice: não têm nada
// além do que o próprio anúncio já mostra.
import { atendeRota } from './busca'
import { caminhoDaRota, lerFiltros, ROTA_VAZIA, type CategoriaRota, type FiltrosRota } from './filtros'
import { precoPlausivel } from './formato'
import { combinacoesDeRota, type IndiceImovel } from './rotas'
import type { Cidade, Faixa, Finalidade } from './tipos'

/** Páginas com menos imóveis que isto não entram no Google (noindex) nem no sitemap. */
export const MIN_IMOVEIS_INDEXAVEL = 2

/** Bairro provisório do cadastro: nunca vira página principal nem aparece em listas de links. */
export const SLUG_BAIRRO_PROVISORIO = 'a-confirmar'

export interface ResumoImoveis {
  total: number
  /** Todos à venda, todos para alugar ou os dois. */
  finalidade: Finalidade | 'ambas' | null
  /** Menor preço, só quando os imóveis são todos de venda ou todos de aluguel (senão os valores não se comparam). */
  menorPreco: number | null
  /** Faixa de quartos dos imóveis que têm quarto (terreno e estúdio ficam de fora). */
  quartos: Faixa | null
  area: Faixa | null
  lancamentos: number
  emConstrucao: number
  prontos: number
  mcmv: number
}

function faixaDe(faixas: Faixa[]): Faixa | null {
  return faixas.length ? { min: Math.min(...faixas.map((f) => f.min)), max: Math.max(...faixas.map((f) => f.max)) } : null
}

export function resumirImoveis(lista: IndiceImovel[]): ResumoImoveis {
  const aluguel = lista.filter((im) => im.finalidade === 'aluguel').length
  const finalidade = !lista.length ? null : aluguel === 0 ? 'venda' : aluguel === lista.length ? 'aluguel' : 'ambas'
  const precos = lista.filter((im) => precoPlausivel(im.finalidade, im.preco)).map((im) => im.preco)
  // Mais de 6 quartos num apartamento é erro de cadastro (já houve um com 22): fica fora da faixa.
  const comQuarto = lista
    .filter((im) => im.quartos.max > 0 && im.quartos.max <= 6)
    .map((im) => ({ min: Math.max(1, im.quartos.min), max: im.quartos.max }))
  return {
    total: lista.length,
    finalidade,
    menorPreco: (finalidade === 'venda' || finalidade === 'aluguel') && precos.length ? Math.min(...precos) : null,
    quartos: faixaDe(comQuarto),
    area: faixaDe(lista.filter((im) => im.area.max > 0).map((im) => ({ min: Math.max(1, im.area.min), max: im.area.max }))),
    lancamentos: lista.filter((im) => im.situacao === 'lancamento' || im.situacao === 'breve-lancamento').length,
    emConstrucao: lista.filter((im) => im.situacao === 'em-construcao').length,
    prontos: lista.filter((im) => im.situacao === 'pronto').length,
    mcmv: lista.filter((im) => im.mcmv).length,
  }
}

export interface PaginaBusca extends ResumoImoveis {
  rota: FiltrosRota
  /** Caminho da página (/imoveis/...). */
  caminho: string
  /** Caminho da página que concentra estes imóveis: a própria, quando não há duplicata ou o conjunto é pequeno. */
  canonico: string
  /** Se entra no Google: é a principal do seu conjunto e tem imóveis suficientes. */
  indexavel: boolean
  /** Data (AAAA-MM-DD) da última alteração entre os imóveis da página. */
  atualizadoEm: string
}

const PESO_CATEGORIA: Record<CategoriaRota, number> = { lancamentos: 3, aluguel: 2, venda: 1 }
const especificidade = (r: FiltrosRota) => [r.categoria, r.tipo, r.cidade, r.bairro].filter(Boolean).length

/** A mais específica do grupo ("Apartamentos à venda no Janga" em vez de "Imóveis no Janga"). */
function escolherPrincipal<T extends { rota: FiltrosRota; caminho: string }>(grupo: T[]): T | undefined {
  return grupo
    .filter((item) => item.rota.bairro !== SLUG_BAIRRO_PROVISORIO)
    .sort(
      (a, b) =>
        especificidade(b.rota) - especificidade(a.rota) ||
        (b.rota.categoria ? PESO_CATEGORIA[b.rota.categoria] : 0) - (a.rota.categoria ? PESO_CATEGORIA[a.rota.categoria] : 0) ||
        a.caminho.localeCompare(b.caminho),
    )[0]
}

/** Todas as páginas de busca que têm imóveis (as mesmas que o site gera de antemão), já com a página principal de cada conjunto. */
export function paginasDeBusca(imoveis: IndiceImovel[]): PaginaBusca[] {
  const grupos = new Map<string, { rota: FiltrosRota; caminho: string; doConjunto: IndiceImovel[] }[]>()
  for (const rota of combinacoesDeRota(imoveis)) {
    const { filtros } = lerFiltros(rota, {})
    const doConjunto = imoveis.filter((im) => atendeRota(im, filtros))
    const chave = doConjunto.map((im) => im.slug).sort().join('|')
    const grupo = grupos.get(chave) ?? []
    grupo.push({ rota, caminho: caminhoDaRota(rota), doConjunto })
    grupos.set(chave, grupo)
  }

  const paginas: PaginaBusca[] = []
  for (const grupo of grupos.values()) {
    const resumo = resumirImoveis(grupo[0]!.doConjunto)
    const atualizadoEm = grupo[0]!.doConjunto.map((im) => im.atualizadoEm).sort().at(-1) ?? ''
    const principal = resumo.total >= MIN_IMOVEIS_INDEXAVEL ? escolherPrincipal(grupo) : undefined
    for (const { rota, caminho } of grupo) {
      paginas.push({
        rota,
        caminho,
        canonico: principal?.caminho ?? caminho,
        indexavel: principal?.caminho === caminho,
        atualizadoEm,
        ...resumo,
      })
    }
  }
  return paginas.sort((a, b) => a.caminho.localeCompare(b.caminho))
}

/**
 * Se a página deve sair do Google (noindex). Duplicatas com canonical para outra página não levam noindex: o canonical
 * já diz qual vale. Busca sem imóveis ou com poucos, sim.
 */
export const semIndexacao = (pagina: PaginaBusca | undefined) =>
  !pagina || (pagina.canonico === pagina.caminho && !pagina.indexavel)

// ---------- Links entre as páginas ----------

function indexar(paginas: PaginaBusca[]) {
  const porCaminho = new Map(paginas.map((p) => [p.caminho, p]))
  /** A página principal do conjunto da página dada. */
  const principal = (p: PaginaBusca) => porCaminho.get(p.canonico) ?? p
  return { porCaminho, principal }
}

/** A página principal de uma busca (a que concentra os imóveis dela), se entra no Google; senão, `undefined`. */
export function paginaPrincipal(paginas: PaginaBusca[], rota: FiltrosRota): PaginaBusca | undefined {
  const { porCaminho, principal } = indexar(paginas)
  const pagina = porCaminho.get(caminhoDaRota(rota))
  const destino = pagina && principal(pagina)
  return destino?.indexavel ? destino : undefined
}

const paginaDoLocal = (paginas: PaginaBusca[], cidade: string, bairro: string | null) =>
  paginaPrincipal(paginas, { ...ROTA_VAZIA, cidade, bairro })

export interface LocalEmDestaque {
  nome: string
  href: string
  total: number
  /** Rota da página principal do local (para montar o texto do link). */
  rota: FiltrosRota
}

export interface CidadeEmDestaque extends LocalEmDestaque {
  uf: string
  bairros: LocalEmDestaque[]
}

/** Cidades (e seus maiores bairros) que têm página no Google, da que tem mais imóveis para a que tem menos. */
export function cidadesEmDestaque(paginas: PaginaBusca[], cidades: Cidade[], bairrosPorCidade = 5): CidadeEmDestaque[] {
  return cidades
    .filter((c) => c.bairros.some((b) => b.slug !== SLUG_BAIRRO_PROVISORIO))
    .flatMap((c) => {
      const pagina = paginaDoLocal(paginas, c.slug, null)
      if (!pagina) return []
      const bairros = c.bairros
        .filter((b) => b.slug !== SLUG_BAIRRO_PROVISORIO)
        .flatMap((b) => {
          const pb = paginaDoLocal(paginas, c.slug, b.slug)
          return pb ? [{ nome: b.nome, href: pb.caminho, total: pb.total, rota: pb.rota }] : []
        })
        .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
        .slice(0, bairrosPorCidade)
      return [{ nome: c.nome, uf: c.uf, href: pagina.caminho, total: pagina.total, rota: pagina.rota, bairros }]
    })
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}

export interface Relacionadas {
  /** Outros bairros da mesma cidade, no mesmo tipo de busca. */
  bairros: PaginaBusca[]
  /** Outras cidades, no mesmo tipo de busca. */
  cidades: PaginaBusca[]
  /** O mesmo lugar em outra categoria ou tipo (ex.: aluguel, lançamentos, casas). */
  outrasBuscas: PaginaBusca[]
}

/** Páginas que valem um link a partir da página dada: sempre a principal de cada conjunto, e só as que entram no Google. */
export function paginasRelacionadas(paginas: PaginaBusca[], atual: PaginaBusca, limite = 8): Relacionadas {
  const { principal } = indexar(paginas)
  const { categoria, tipo, cidade, bairro } = atual.rota
  const mesmaBusca = (r: FiltrosRota) => r.categoria === categoria && r.tipo === tipo

  // `distintas`: pula as páginas com quase os mesmos imóveis (menos de 10% de diferença) de uma já escolhida ou da atual.
  const escolher = (candidatas: PaginaBusca[], max = limite, distintas = false) => {
    const vistas = new Set([principal(atual).caminho])
    const totais = [atual.total]
    const saida: PaginaBusca[] = []
    for (const p of candidatas.map(principal).sort((a, b) => b.total - a.total || a.caminho.localeCompare(b.caminho))) {
      if (!p.indexavel || vistas.has(p.caminho)) continue
      if (distintas && totais.some((t) => Math.abs(t - p.total) < 0.1 * Math.max(t, p.total))) continue
      vistas.add(p.caminho)
      totais.push(p.total)
      saida.push(p)
    }
    return saida.slice(0, max)
  }
  // Uma cidade que só tem o bairro provisório ("A confirmar") não é um lugar de verdade: não ganha link.
  const cidadesReais = new Set(paginas.filter((p) => p.rota.bairro && p.rota.bairro !== SLUG_BAIRRO_PROVISORIO).map((p) => p.rota.cidade))

  return {
    bairros: cidade
      ? escolher(paginas.filter((p) => mesmaBusca(p.rota) && p.rota.cidade === cidade && p.rota.bairro && p.rota.bairro !== bairro))
      : [],
    cidades: bairro
      ? []
      : escolher(
          paginas.filter((p) => mesmaBusca(p.rota) && p.rota.cidade && cidadesReais.has(p.rota.cidade) && p.rota.cidade !== cidade && !p.rota.bairro),
        ),
    outrasBuscas: escolher(
      paginas.filter((p) => p.rota.cidade === cidade && p.rota.bairro === bairro && !mesmaBusca(p.rota)),
      6,
      true,
    ),
  }
}
