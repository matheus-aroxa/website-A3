// Nome legível de cada página do site nos relatórios ("/imovel/residencial-x" → "Residencial X").
import 'server-only'
import { banco } from '@/lib/db'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import { listarCidades } from '@/lib/imoveis/repositorio'
import { textosDaBusca } from '@/lib/imoveis/rotas'
import { PADRAO_IDIOMAS, ehIdioma, secaoDoCaminho } from '@/lib/internacional/idiomas'

export interface NomeDePagina {
  nome: string
  /** Endereço no site, para abrir a página. */
  href: string
}

export async function criarNomeadorDePaginas() {
  const [cidades, { rows }] = await Promise.all([listarCidades(), banco().query<{ slug: string; nome: string }>('SELECT slug, nome FROM imoveis')])
  const imoveis = new Map(rows.map((r) => [r.slug, r.nome]))
  return (caminho: string): NomeDePagina => {
    if (caminho === '/') return { nome: 'Página inicial', href: '/' }
    if (caminho === '/politica-de-privacidade') return { nome: 'Política de privacidade', href: caminho }
    const imovel = /^\/imovel\/([^/]+)$/.exec(caminho)?.[1]
    if (imovel) return { nome: imoveis.get(imovel) ?? `Imóvel removido (${imovel.slice(0, 40)})`, href: caminho }
    // Área internacional: "[EN] Residencial X", "[IT] Guia de compra"…
    const internacional = new RegExp(`^/(${PADRAO_IDIOMAS})(?:/([^/]+))?(?:/([^/]+))?$`).exec(caminho)
    if (internacional) {
      const [, idioma, secao, slug] = internacional
      const prefixo = `[${idioma!.toUpperCase()}]`
      if (slug) return { nome: `${prefixo} ${imoveis.get(slug) ?? `Imóvel removido (${slug.slice(0, 40)})`}`, href: caminho }
      const nomes: Record<string, string> = { imoveis: 'Imóveis', guia: 'Guia de compra', regiao: 'A região' }
      const qual = secao && ehIdioma(idioma!) ? secaoDoCaminho(idioma, secao) : undefined
      return { nome: `${prefixo} ${qual ? nomes[qual] : secao ? secao : 'Página inicial'}`, href: caminho }
    }
    if (caminho === '/imoveis' || caminho.startsWith('/imoveis/')) {
      const rota = interpretarSegmentos(caminho.split('/').slice(2).filter(Boolean), cidades)
      return { nome: rota ? `Busca: ${textosDaBusca(rota, cidades).h1}` : caminho, href: caminho }
    }
    return { nome: caminho, href: caminho }
  }
}
