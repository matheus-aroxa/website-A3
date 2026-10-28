// Nome legível de cada página do site nos relatórios ("/imovel/residencial-x" → "Residencial X").
import 'server-only'
import { banco } from '@/lib/db'
import { interpretarSegmentos } from '@/lib/imoveis/filtros'
import { listarCidades } from '@/lib/imoveis/repositorio'
import { textosDaBusca } from '@/lib/imoveis/rotas'

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
    if (caminho === '/imoveis' || caminho.startsWith('/imoveis/')) {
      const rota = interpretarSegmentos(caminho.split('/').slice(2).filter(Boolean), cidades)
      return { nome: rota ? `Busca: ${textosDaBusca(rota, cidades).h1}` : caminho, href: caminho }
    }
    return { nome: caminho, href: caminho }
  }
}
