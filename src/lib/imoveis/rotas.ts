// Textos de SEO e navegação derivados da URL de busca e do imóvel.
import { rotuloTipoPlural } from './formato'
import { caminhoDaRota, ROTA_VAZIA, type CategoriaRota, type FiltrosRota } from './filtros'
import type { Cidade, Imovel } from './tipos'

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

function nomesLocal(rota: FiltrosRota, cidades: Cidade[]) {
  const cidade = cidades.find((c) => c.slug === rota.cidade)
  const bairro = cidade?.bairros.find((b) => b.slug === rota.bairro)
  return { cidade: cidade?.nome, bairro: bairro?.nome }
}

export function textosDaBusca(rota: FiltrosRota, cidades: Cidade[]) {
  const { cidade, bairro } = nomesLocal(rota, cidades)
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

  // Title e description: palavra-chave + local + UF, dentro dos limites que o Google exibe.
  const tituloSeo = `${titulo}${local ? ` em ${local} – PE` : ' em Paulista, Recife e região'}`
  const descricao =
    `${titulo}${emLocal || ' em Paulista, Recife e região'}. ` +
    'Veja fotos, plantas, valores e agende uma visita com um corretor da A3 Soluções Imobiliárias.'

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

/** Combinações de caminho que geram páginas de busca (para generateStaticParams e sitemap). */
export function combinacoesDeRota(imoveis: Imovel[]): FiltrosRota[] {
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
