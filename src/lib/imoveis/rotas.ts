// Textos de SEO e navegação derivados da URL de busca e do imóvel.
import {
  formatarEntrega,
  formatarPreco,
  precoPlausivel,
  rotuloPreco,
  rotuloTipo,
  rotuloTipoPlural,
} from './formato'
import { caminhoDaRota, ROTA_VAZIA, type CategoriaRota, type FiltrosRota } from './filtros'
import type { ResumoImoveis } from './paginas'
import type { Cidade, Imovel, TipoImovel } from './tipos'
import { site } from '@/lib/site'

export interface Migalha {
  nome: string
  href: string
}

export function urlImovel(slug: string) {
  return `/imovel/${slug}`
}

const ROTULO_CATEGORIA: Record<CategoriaRota, string> = {
  venda: 'À venda',
  aluguel: 'Para alugar',
  lancamentos: 'Lançamentos',
}

const TIPO_NO_SINGULAR: Record<TipoImovel, string> = {
  apartamento: 'apartamento',
  'casa-condominio': 'casa de condomínio',
  terreno: 'terreno',
}

/** Onde o site atua quando a busca não tem cidade: vai nos títulos e descrições. */
const REGIAO_PADRAO = 'Paulista, Recife e região'

function nomesLocal(rota: FiltrosRota, cidades: Cidade[]) {
  const cidade = cidades.find((c) => c.slug === rota.cidade)
  const bairro = cidade?.bairros.find((b) => b.slug === rota.bairro)
  return { cidade: cidade?.nome, bairro: bairro?.nome, uf: cidade?.uf }
}

const plural = (n: number, singular: string, mais: string) => `${n} ${n === 1 ? singular : mais}`

/** "27 apartamentos à venda", "1 lançamento de casa de condomínio", "12 imóveis para alugar". */
function quantosImoveis(rota: FiltrosRota, total: number) {
  const tipo = rota.tipo ? (total === 1 ? TIPO_NO_SINGULAR[rota.tipo] : rotuloTipoPlural[rota.tipo].toLowerCase()) : null
  if (rota.categoria === 'lancamentos') return `${plural(total, 'lançamento', 'lançamentos')}${tipo ? ` de ${tipo}` : ''}`
  const objeto = tipo ?? (total === 1 ? 'imóvel' : 'imóveis')
  const oferta = rota.categoria === 'aluguel' ? ' para alugar' : rota.categoria === 'venda' ? ' à venda' : ''
  return `${total} ${objeto}${oferta}`
}

/** `resumo` (os imóveis que a página mostra) deixa a descrição específica: quantos são e a partir de quanto. */
export function textosDaBusca(rota: FiltrosRota, cidades: Cidade[], resumo?: ResumoImoveis) {
  const { cidade, bairro, uf } = nomesLocal(rota, cidades)
  const local = bairro ? `${bairro}, ${cidade}` : cidade
  const emLocal = local ? ` em ${local}` : ''
  const tipo = rota.tipo ? rotuloTipoPlural[rota.tipo] : null

  let titulo: string
  switch (rota.categoria) {
    case 'venda':
      titulo = tipo ? `${tipo} à venda` : 'Apartamentos, casas e lançamentos à venda'
      break
    case 'aluguel':
      titulo = tipo ? `${tipo} para alugar` : 'Apartamentos e casas para alugar'
      break
    case 'lancamentos':
      titulo = tipo ? `Lançamentos de ${tipo.toLowerCase()}` : 'Lançamentos imobiliários'
      break
    default:
      titulo = tipo ? `${tipo} à venda e para alugar` : 'Imóveis à venda e para alugar'
  }
  const h1 = titulo + emLocal

  const subtitulo =
    rota.categoria === 'aluguel'
      ? 'Imóveis para alugar com atendimento de um corretor da A3.'
      : rota.categoria === 'venda'
        ? 'Imóveis prontos, em construção e lançamentos, com atendimento de um corretor da A3.'
        : rota.categoria === 'lancamentos'
          ? 'Imóveis na planta das construtoras parceiras, com orientação sobre o Minha Casa Minha Vida.'
          : 'Chegou a hora de realizar o sonho da casa própria: apartamentos, casas e lançamentos para comprar ou alugar, com atendimento de um corretor da A3.'

  // Title: palavra-chave + local + UF + marca, na versão mais completa que cabe nos ~64 caracteres que o Google mostra.
  // O título leva a marca por conta própria (a página usa `title.absolute`), então sai dela antes de sair do lugar.
  const comUf = `${titulo}${local ? ` em ${local}${uf ? ` – ${uf}` : ''}` : ` em ${REGIAO_PADRAO}`}`
  const variantes = [`${comUf} | ${site.nomeCurto}`, comUf, `${titulo} em ${local ?? REGIAO_PADRAO}`, ...(bairro ? [`${titulo} em ${bairro}`] : [])]
  const tituloSeo = variantes.find((v) => v.length <= 64) ?? variantes[2]!
  let descricao = `${titulo}${emLocal || ` em ${REGIAO_PADRAO}`}. Veja fotos, plantas, valores e agende uma visita com um corretor da A3 Soluções Imobiliárias.`
  if (resumo && resumo.total > 0) {
    const base = `${quantosImoveis(rota, resumo.total)} em ${local ?? REGIAO_PADRAO}`
    const fim = '. Veja fotos, plantas e fale com um corretor da A3.'
    const comPreco =
      resumo.menorPreco && resumo.finalidade && resumo.finalidade !== 'ambas'
        ? `${base}, a partir de ${formatarPreco(resumo.menorPreco, resumo.finalidade)}${fim}`
        : null
    descricao = comPreco && comPreco.length <= 158 ? comPreco : `${base}${fim}`
  }

  return { h1, subtitulo, tituloSeo, descricao }
}

export function migalhasDaBusca(rota: FiltrosRota, cidades: Cidade[]): Migalha[] {
  const { cidade, bairro } = nomesLocal(rota, cidades)
  const migalhas: Migalha[] = [
    { nome: 'Início', href: '/' },
    { nome: 'Imóveis', href: '/imoveis' },
  ]
  const parcial: FiltrosRota = { ...ROTA_VAZIA }
  if (rota.categoria) {
    parcial.categoria = rota.categoria
    migalhas.push({ nome: ROTULO_CATEGORIA[rota.categoria], href: caminhoDaRota(parcial) })
  }
  if (rota.tipo) {
    parcial.tipo = rota.tipo
    migalhas.push({ nome: rotuloTipoPlural[rota.tipo], href: caminhoDaRota(parcial) })
  }
  if (cidade) {
    parcial.cidade = rota.cidade
    migalhas.push({ nome: cidade, href: caminhoDaRota(parcial) })
  }
  if (bairro) {
    parcial.bairro = rota.bairro
    migalhas.push({ nome: bairro, href: caminhoDaRota(parcial) })
  }
  return migalhas
}

export function categoriaDoImovel(im: Pick<Imovel, 'finalidade' | 'situacao'>): CategoriaRota {
  if (im.finalidade === 'aluguel') return 'aluguel'
  return im.situacao === 'lancamento' || im.situacao === 'breve-lancamento' ? 'lancamentos' : 'venda'
}

export function migalhasDoImovel(im: Imovel): Migalha[] {
  const categoria = categoriaDoImovel(im)
  return [
    { nome: 'Início', href: '/' },
    { nome: ROTULO_CATEGORIA[categoria], href: caminhoDaRota({ ...ROTA_VAZIA, categoria }) },
    { nome: im.local.cidade, href: caminhoDaRota({ ...ROTA_VAZIA, categoria, cidade: im.local.cidadeSlug }) },
    { nome: im.nome, href: urlImovel(im.slug) },
  ]
}

// ---------- Título e descrição do anúncio ----------

/** O Google corta o título em torno de 60 caracteres; estas variantes vão da mais completa à mais curta. */
export function tituloDoImovel(im: Pick<Imovel, 'nome' | 'tipo' | 'finalidade' | 'local'>) {
  const oferta = im.finalidade === 'aluguel' ? 'para alugar' : 'à venda'
  const { bairro, cidade } = im.local
  return (
    [
      `${im.nome} – ${rotuloTipo[im.tipo]} ${oferta} em ${bairro}, ${cidade}`,
      `${im.nome} – ${rotuloTipo[im.tipo]} ${oferta} em ${bairro}`,
      `${im.nome} – ${bairro}, ${cidade}`,
    ].find((t) => t.length <= 65) ?? im.nome
  )
}

// Ex.: "Apartamentos de 2 e 3 quartos com suíte em Jaguaribe, Paulista – PE. Investimento a partir de R$ 265.000,
// entrega prevista para janeiro de 2028. Agende sua visita."
export function descricaoDoImovel(im: Pick<Imovel, 'chamada' | 'finalidade' | 'situacao' | 'preco' | 'entrega'>) {
  const chamada = im.chamada.replace(/[.\s]+$/, '')
  const preco = precoPlausivel(im.finalidade, im.preco) ? `${rotuloPreco(im.finalidade)} ${formatarPreco(im.preco, im.finalidade)}` : ''
  const entrega = im.entrega && im.situacao !== 'pronto' ? `entrega prevista para ${formatarEntrega(im.entrega).toLowerCase()}` : ''
  const valores = [preco, entrega].filter(Boolean).join(', ')
  const convite = im.finalidade === 'aluguel' ? 'Fale com um corretor' : 'Agende sua visita'
  const frases = (...partes: string[]) => partes.filter(Boolean).map((f) => `${f.charAt(0).toUpperCase()}${f.slice(1)}.`).join(' ')
  // Passando de ~160 caracteres o Google corta: sai primeiro a entrega, depois o convite.
  return (
    [frases(chamada, valores, convite), frases(chamada, preco, convite), frases(chamada, preco)].find((d) => d.length <= 160) ??
    frases(chamada)
  )
}

/** O mínimo de um imóvel publicado para gerar rotas e sitemap (um `Imovel` completo também serve). */
export interface IndiceImovel
  extends Pick<Imovel, 'slug' | 'finalidade' | 'situacao' | 'tipo' | 'atualizadoEm' | 'preco' | 'mcmv' | 'quartos' | 'area'> {
  local: Pick<Imovel['local'], 'cidadeSlug' | 'bairroSlug'>
  /** Só no sitemap: src das fotos, na ordem da galeria. */
  fotos?: string[]
}

/** Combinações de caminho que geram páginas de busca (para generateStaticParams e sitemap). */
export function combinacoesDeRota(imoveis: IndiceImovel[]): FiltrosRota[] {
  const chaves = new Set<string>()
  const rotas: FiltrosRota[] = []
  for (const im of imoveis) {
    const categorias: (CategoriaRota | null)[] = [null, im.finalidade === 'aluguel' ? 'aluguel' : 'venda']
    const cat = categoriaDoImovel(im)
    if (cat === 'lancamentos') categorias.push('lancamentos')
    for (const categoria of categorias)
      for (const tipo of [null, im.tipo])
        for (const [cidade, bairro] of [
          [null, null],
          [im.local.cidadeSlug, null],
          [im.local.cidadeSlug, im.local.bairroSlug],
        ] as const) {
          const rota: FiltrosRota = { categoria, tipo, cidade, bairro }
          const chave = caminhoDaRota(rota)
          if (!chaves.has(chave)) {
            chaves.add(chave)
            rotas.push(rota)
          }
        }
  }
  return rotas
}
