// O que o site já publicou a partir do banco e precisa continuar igual quando o catálogo vem da Viniun:
// o endereço (slug) e o id de cada imóvel, e os slugs de cidades e bairros. Mudar um endereço já indexado custaria
// o posicionamento no Google; o id é o que liga as visitas e contatos (relatórios) ao imóvel.
// Os imóveis da Viniun são os mesmos do banco (foram importados dele) e o código de referência (AP0277…) é o mesmo nos dois.
import 'server-only'
import { banco } from '@/lib/db'
import { normalizarBusca } from '../formato'

export interface Referencias {
  /** Código de referência → id e slug do imóvel no banco. */
  porCodigo: Map<string, { id: string; slug: string }>
  /** "nome normalizado|UF" → slug da cidade. */
  cidades: Map<string, string>
  /** "slug da cidade|nome normalizado" → slug do bairro. */
  bairros: Map<string, string>
}

export const chaveCidade = (nome: string, uf: string) => `${normalizarBusca(nome)}|${uf.toUpperCase()}`
export const chaveBairro = (cidadeSlug: string, nome: string) => `${cidadeSlug}|${normalizarBusca(nome)}`

export async function lerReferencias(): Promise<Referencias> {
  const [imoveis, locais] = await Promise.all([
    banco().query<{ id: string; codigo: string; slug: string }>('SELECT id, codigo, slug FROM imoveis'),
    banco().query<{ cidade: string; uf: string; cidade_slug: string; bairro: string | null; bairro_slug: string | null }>(
      `SELECT c.nome AS cidade, c.uf, c.slug AS cidade_slug, b.nome AS bairro, b.slug AS bairro_slug
         FROM cidades c LEFT JOIN bairros b ON b.cidade_id = c.id`,
    ),
  ])
  const cidades = new Map<string, string>()
  const bairros = new Map<string, string>()
  for (const l of locais.rows) {
    cidades.set(chaveCidade(l.cidade, l.uf), l.cidade_slug)
    if (l.bairro && l.bairro_slug) bairros.set(chaveBairro(l.cidade_slug, l.bairro), l.bairro_slug)
  }
  return {
    porCodigo: new Map(imoveis.rows.map((r) => [r.codigo.toUpperCase(), { id: r.id, slug: r.slug }])),
    cidades,
    bairros,
  }
}
