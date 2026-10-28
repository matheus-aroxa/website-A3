// Desempenho de cada imóvel no período (visitas, interesse e contatos), cruzado com os dados do catálogo.
// Imóvel excluído continua nos números, como "Imóvel removido".
import 'server-only'
import { exigirAdmin } from '@/lib/admin/acesso'
import { banco } from '@/lib/db'
import type { Periodo } from './periodo'
import { atualizarResumo } from './resumo'

export interface DesempenhoImovel {
  id: string
  nome: string
  slug: string | null
  cidade: string
  bairro: string
  construtora: string
  tipo: string | null
  finalidade: string | null
  situacao: string | null
  preco: number | null
  /** `null` quando o imóvel foi excluído. */
  status: string | null
  visitas: number
  visitantes: number
  sessoes: number
  /** Sessões que terminaram em contato sobre este imóvel. */
  conversoes: number
  /** Segundos médios na página. */
  tempoMedio: number
  /** Rolagem média da página, de 0 a 100. */
  rolagemMedia: number
  whatsapp: number
  ligacao: number
  email: number
  formulario: number
  galeria: number
  mapa: number
  compartilhar: number
  cliques: number
}

export async function desempenhoDosImoveis(p: Pick<Periodo, 'de' | 'ate'>): Promise<DesempenhoImovel[]> {
  await exigirAdmin()
  await atualizarResumo(30)
  const { rows } = await banco().query<DesempenhoImovel>(
    `WITH v AS (
       SELECT imovel_id, sum(visitas) AS visitas, sum(visitantes) AS visitantes, sum(sessoes) AS sessoes, sum(conversoes) AS conversoes,
              sum(eventos) AS com_medida, sum(tempo_s) AS tempo, sum(valor) AS rolagem
         FROM resumo_diario WHERE dimensao = 'imovel' AND dia BETWEEN $1 AND $2 GROUP BY imovel_id
     ), a AS (
       SELECT imovel_id,
              sum(eventos) FILTER (WHERE chave LIKE 'whatsapp%') AS whatsapp,
              sum(eventos) FILTER (WHERE chave LIKE 'ligacao%') AS ligacao,
              sum(eventos) FILTER (WHERE chave LIKE 'email%') AS email,
              sum(eventos) FILTER (WHERE chave LIKE 'formulario-enviado%') AS formulario,
              sum(eventos) FILTER (WHERE chave LIKE 'galeria%') AS galeria,
              sum(eventos) FILTER (WHERE chave LIKE 'mapa%') AS mapa,
              sum(eventos) FILTER (WHERE chave LIKE 'compartilhar%') AS compartilhar,
              sum(eventos) FILTER (WHERE chave LIKE 'card%') AS cliques
         FROM resumo_diario WHERE dimensao = 'acao' AND imovel_id <> '' AND dia BETWEEN $1 AND $2 GROUP BY imovel_id
     ), base AS (SELECT id AS imovel_id FROM imoveis UNION SELECT imovel_id FROM v UNION SELECT imovel_id FROM a)
     SELECT base.imovel_id AS id,
            COALESCE(i.nome, 'Imóvel removido') AS nome, i.slug, COALESCE(c.nome, '—') AS cidade, COALESCE(b.nome, '—') AS bairro,
            COALESCE(co.nome, '—') AS construtora, i.tipo::text AS tipo, i.finalidade::text AS finalidade, i.situacao::text AS situacao,
            i.preco::float8 AS preco, i.status::text AS status,
            COALESCE(v.visitas, 0)::float8 AS visitas, COALESCE(v.visitantes, 0)::float8 AS visitantes,
            COALESCE(v.sessoes, 0)::float8 AS sessoes, COALESCE(v.conversoes, 0)::float8 AS conversoes,
            CASE WHEN v.com_medida > 0 THEN v.tempo::float8 / v.com_medida ELSE 0 END AS "tempoMedio",
            CASE WHEN v.com_medida > 0 THEN v.rolagem::float8 / v.com_medida ELSE 0 END AS "rolagemMedia",
            COALESCE(a.whatsapp, 0)::float8 AS whatsapp, COALESCE(a.ligacao, 0)::float8 AS ligacao, COALESCE(a.email, 0)::float8 AS email,
            COALESCE(a.formulario, 0)::float8 AS formulario, COALESCE(a.galeria, 0)::float8 AS galeria, COALESCE(a.mapa, 0)::float8 AS mapa,
            COALESCE(a.compartilhar, 0)::float8 AS compartilhar, COALESCE(a.cliques, 0)::float8 AS cliques
       FROM base
       LEFT JOIN imoveis i ON i.id = base.imovel_id
       LEFT JOIN bairros b ON b.id = i.bairro_id
       LEFT JOIN cidades c ON c.id = b.cidade_id
       LEFT JOIN construtoras co ON co.id = i.construtora_id
       LEFT JOIN v ON v.imovel_id = base.imovel_id
       LEFT JOIN a ON a.imovel_id = base.imovel_id`,
    [p.de, p.ate],
  )
  return rows
}

/** Total de contatos (WhatsApp, ligação, e-mail e formulário) sobre o imóvel. */
export const contatosDe = (i: DesempenhoImovel) => i.whatsapp + i.ligacao + i.email + i.formulario

export interface GrupoDeImoveis {
  chave: string
  imoveis: number
  visitas: number
  visitantes: number
  sessoes: number
  conversoes: number
  contatos: number
}

/** Soma o desempenho dos imóveis por um critério (construtora, cidade, faixa de preço...). */
export function agruparImoveis(lista: DesempenhoImovel[], chaveDe: (i: DesempenhoImovel) => string | null): GrupoDeImoveis[] {
  const grupos = new Map<string, GrupoDeImoveis>()
  for (const i of lista) {
    const chave = chaveDe(i)
    if (chave === null) continue
    const g = grupos.get(chave) ?? { chave, imoveis: 0, visitas: 0, visitantes: 0, sessoes: 0, conversoes: 0, contatos: 0 }
    g.imoveis += i.status === null ? 0 : 1
    g.visitas += i.visitas
    g.visitantes += i.visitantes
    g.sessoes += i.sessoes
    g.conversoes += i.conversoes
    g.contatos += contatosDe(i)
    grupos.set(chave, g)
  }
  return [...grupos.values()]
}

export const FAIXAS_DE_PRECO = [
  { chave: 'ate-200', rotulo: 'Até R$ 200 mil', max: 200_000 },
  { chave: '200-300', rotulo: 'R$ 200 a 300 mil', max: 300_000 },
  { chave: '300-500', rotulo: 'R$ 300 a 500 mil', max: 500_000 },
  { chave: '500-1000', rotulo: 'R$ 500 mil a 1 mi', max: 1_000_000 },
  { chave: 'acima-1000', rotulo: 'Acima de R$ 1 mi', max: Infinity },
] as const

/** Faixa de preço de um imóvel à venda (aluguel e imóvel excluído ficam de fora). */
export function faixaDePreco(i: Pick<DesempenhoImovel, 'preco' | 'finalidade'>) {
  if (i.preco === null || i.finalidade !== 'venda') return null
  return FAIXAS_DE_PRECO.find((f) => i.preco! <= f.max)!.rotulo
}
