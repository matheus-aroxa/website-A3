// Páginas do programa Minha Casa Minha Vida: /minha-casa-minha-vida e /minha-casa-minha-vida/[cidade].
// Cada uma reúne os imóveis do catálogo marcados como elegíveis ao programa.
import { formatarPreco } from './formato'
import { SLUG_BAIRRO_PROVISORIO, type ResumoImoveis } from './paginas'
import type { IndiceImovel } from './rotas'
import type { Cidade } from './tipos'
import { site } from '@/lib/site'

export const CAMINHO_MCMV = '/minha-casa-minha-vida'

/** Cidade com menos imóveis do programa que isto não ganha página própria (ficaria vazia de conteúdo). */
export const MIN_MCMV_CIDADE = 2

export const caminhoMcmv = (cidadeSlug?: string | null) => (cidadeSlug ? `${CAMINHO_MCMV}/${cidadeSlug}` : CAMINHO_MCMV)

export interface CidadeMcmv {
  nome: string
  slug: string
  uf: string
  total: number
  href: string
}

/** Cidades com imóveis do programa suficientes para uma página, da que tem mais para a que tem menos. */
export function cidadesComMcmv(indice: IndiceImovel[], cidades: Cidade[]): CidadeMcmv[] {
  const contagem = new Map<string, number>()
  for (const im of indice) if (im.mcmv) contagem.set(im.local.cidadeSlug, (contagem.get(im.local.cidadeSlug) ?? 0) + 1)
  return cidades
    .filter((c) => c.bairros.some((b) => b.slug !== SLUG_BAIRRO_PROVISORIO))
    .flatMap((c) => {
      const total = contagem.get(c.slug) ?? 0
      return total >= MIN_MCMV_CIDADE ? [{ nome: c.nome, slug: c.slug, uf: c.uf, total, href: caminhoMcmv(c.slug) }] : []
    })
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Título, descrição e abertura da página; `cidade` é nula na página geral. */
export function textosMcmv(cidade: Pick<Cidade, 'nome' | 'uf'> | null, resumo: ResumoImoveis) {
  const onde = cidade ? `${cidade.nome} – ${cidade.uf}` : 'Paulista, Recife e região'
  const emOnde = cidade ? cidade.nome : 'Paulista, Recife e região'
  const preco = resumo.menorPreco ? `, a partir de ${formatarPreco(resumo.menorPreco, 'venda')}` : ''
  const quantos = `${resumo.total} ${resumo.total === 1 ? 'imóvel' : 'imóveis'}`
  return {
    h1: `Imóveis do Minha Casa Minha Vida em ${emOnde}`,
    // A página geral usa título absoluto (já com a marca); o das cidades recebe o sufixo padrão do layout.
    titulo: cidade ? `Minha Casa Minha Vida em ${onde}` : `Minha Casa Minha Vida em ${onde} | ${site.nomeCurto}`,
    descricao: `${quantos} do Minha Casa Minha Vida em ${emOnde}${preco}. Veja fotos, plantas e fale com um corretor da A3 para saber se você se enquadra.`,
    abertura: `A A3 Soluções Imobiliárias reúne ${quantos} em ${emOnde} que participam do programa Minha Casa Minha Vida${preco}. Cada anúncio mostra fotos, plantas, metragem e previsão de entrega.`,
  }
}
