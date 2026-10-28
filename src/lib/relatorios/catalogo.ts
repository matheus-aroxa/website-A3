// Relatórios do catálogo: o que está cadastrado hoje (imóveis, construtoras, cidades...) e a qualidade do cadastro.
// Lê direto das tabelas do site, então não depende da medição de uso e já tem números desde o primeiro dia.
import 'server-only'
import { exigirAdmin } from '@/lib/admin/acesso'
import { banco } from '@/lib/db'

export interface Contagem {
  chave: string
  valor: number
}

const ATIVO = "i.status = 'ativo'"
const LOCAL = `FROM imoveis i JOIN bairros b ON b.id = i.bairro_id JOIN cidades c ON c.id = b.cidade_id`

async function contar(sql: string, params: unknown[] = []) {
  const { rows } = await banco().query<{ chave: string; valor: number }>(sql, params)
  return rows.map((r): Contagem => ({ chave: r.chave, valor: Number(r.valor) }))
}

export interface ResumoDoCatalogo {
  imoveis: { total: number; ativos: number; inativos: number; venda: number; aluguel: number; lancamentos: number; mcmv: number; naVitrine: number }
  construtoras: { total: number; comImoveis: number; semImoveis: number; imoveisNaoInformados: number }
  local: { cidades: number; bairros: number }
  midia: { fotos: number; plantas: number; imoveisComPlanta: number }
  administradores: number
  precos: { medioVenda: number; medianoVenda: number; medioAluguel: number }
  ultimaAtualizacao: string | null
}

export async function resumoDoCatalogo(): Promise<ResumoDoCatalogo> {
  await exigirAdmin()
  const { rows } = await banco().query(
    `SELECT
       (SELECT count(*) FROM imoveis WHERE status <> 'excluido')::int AS total,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo')::int AS ativos,
       (SELECT count(*) FROM imoveis WHERE status = 'inativo')::int AS inativos,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo' AND finalidade = 'venda')::int AS venda,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo' AND finalidade = 'aluguel')::int AS aluguel,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo' AND finalidade = 'venda' AND situacao IN ('breve-lancamento', 'lancamento'))::int AS lancamentos,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo' AND mcmv)::int AS mcmv,
       (SELECT count(*) FROM imoveis WHERE status = 'ativo' AND (destaque OR heroi))::int AS na_vitrine,
       (SELECT count(*) FROM construtoras WHERE NOT padrao)::int AS construtoras,
       (SELECT count(*) FROM construtoras co WHERE NOT co.padrao AND EXISTS (SELECT 1 FROM imoveis i WHERE i.construtora_id = co.id AND i.status = 'ativo'))::int AS construtoras_com,
       (SELECT count(*) FROM imoveis i JOIN construtoras co ON co.id = i.construtora_id WHERE i.status = 'ativo' AND co.padrao)::int AS nao_informados,
       (SELECT count(DISTINCT c.id) ${LOCAL} WHERE ${ATIVO})::int AS cidades,
       (SELECT count(DISTINCT b.id) ${LOCAL} WHERE ${ATIVO})::int AS bairros,
       (SELECT count(*) FROM fotos f JOIN imoveis i ON i.id = f.imovel_id WHERE ${ATIVO})::int AS fotos,
       (SELECT count(*) FROM plantas p JOIN imoveis i ON i.id = p.imovel_id WHERE ${ATIVO})::int AS plantas,
       (SELECT count(DISTINCT p.imovel_id) FROM plantas p JOIN imoveis i ON i.id = p.imovel_id WHERE ${ATIVO})::int AS com_planta,
       (SELECT count(*) FROM administradores WHERE ativo)::int AS administradores,
       COALESCE((SELECT avg(preco) FROM imoveis i WHERE ${ATIVO} AND finalidade = 'venda' AND preco > 0), 0)::float8 AS preco_medio,
       COALESCE((SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY preco) FROM imoveis i WHERE ${ATIVO} AND finalidade = 'venda' AND preco > 0), 0)::float8 AS preco_mediano,
       COALESCE((SELECT avg(preco) FROM imoveis i WHERE ${ATIVO} AND finalidade = 'aluguel' AND preco > 0), 0)::float8 AS aluguel_medio,
       (SELECT max(alterado_em)::text FROM imoveis) AS ultima`,
  )
  const r = rows[0]
  return {
    imoveis: { total: r.total, ativos: r.ativos, inativos: r.inativos, venda: r.venda, aluguel: r.aluguel, lancamentos: r.lancamentos, mcmv: r.mcmv, naVitrine: r.na_vitrine },
    construtoras: { total: r.construtoras, comImoveis: r.construtoras_com, semImoveis: r.construtoras - r.construtoras_com, imoveisNaoInformados: r.nao_informados },
    local: { cidades: r.cidades, bairros: r.bairros },
    midia: { fotos: r.fotos, plantas: r.plantas, imoveisComPlanta: r.com_planta },
    administradores: r.administradores,
    precos: { medioVenda: r.preco_medio, medianoVenda: r.preco_mediano, medioAluguel: r.aluguel_medio },
    ultimaAtualizacao: r.ultima,
  }
}

export interface DistribuicoesDoCatalogo {
  tipo: Contagem[]
  finalidade: Contagem[]
  situacao: Contagem[]
  cidade: (Contagem & { precoMediano: number })[]
  bairro: (Contagem & { cidade: string })[]
  construtora: Contagem[]
  faixaDePreco: Contagem[]
  quartos: Contagem[]
  entrega: Contagem[]
  origem: Contagem[]
  atualizacao: Contagem[]
  fotos: Contagem[]
  cadastrosPorMes: Contagem[]
  precoPorM2PorCidade: (Contagem & { imoveis: number })[]
}

export async function distribuicoesDoCatalogo(): Promise<DistribuicoesDoCatalogo> {
  await exigirAdmin()
  const [tipo, finalidade, situacao, cidade, bairro, construtora, faixaDePreco, quartos, entrega, origem, atualizacao, fotos, cadastrosPorMes, precoPorM2PorCidade] = await Promise.all([
    contar(`SELECT tipo::text AS chave, count(*) AS valor FROM imoveis i WHERE ${ATIVO} GROUP BY 1 ORDER BY 2 DESC`),
    contar(`SELECT finalidade::text AS chave, count(*) AS valor FROM imoveis i WHERE ${ATIVO} GROUP BY 1 ORDER BY 2 DESC`),
    contar(`SELECT situacao::text AS chave, count(*) AS valor FROM imoveis i WHERE ${ATIVO} AND finalidade = 'venda' GROUP BY 1 ORDER BY 2 DESC`),
    banco()
      .query<{ chave: string; valor: number; preco_mediano: number }>(
        `SELECT c.nome AS chave, count(*)::int AS valor,
                COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY i.preco) FILTER (WHERE i.finalidade = 'venda' AND i.preco > 0), 0)::float8 AS preco_mediano
           ${LOCAL} WHERE ${ATIVO} GROUP BY c.nome ORDER BY 2 DESC, 1`,
      )
      .then((r) => r.rows.map((x) => ({ chave: x.chave, valor: Number(x.valor), precoMediano: x.preco_mediano }))),
    banco()
      .query<{ chave: string; valor: number; cidade: string }>(
        `SELECT b.nome AS chave, c.nome AS cidade, count(*)::int AS valor ${LOCAL} WHERE ${ATIVO} GROUP BY b.id, b.nome, c.nome ORDER BY 3 DESC, 1 LIMIT 20`,
      )
      .then((r) => r.rows.map((x) => ({ chave: x.chave, valor: Number(x.valor), cidade: x.cidade }))),
    contar(
      `SELECT co.nome AS chave, count(*) AS valor FROM imoveis i JOIN construtoras co ON co.id = i.construtora_id
        WHERE ${ATIVO} GROUP BY co.id, co.nome, co.padrao ORDER BY co.padrao, 2 DESC, 1`,
    ),
    contar(
      `SELECT CASE WHEN preco <= 200000 THEN '1|Até R$ 200 mil' WHEN preco <= 300000 THEN '2|R$ 200 a 300 mil' WHEN preco <= 500000 THEN '3|R$ 300 a 500 mil'
                   WHEN preco <= 1000000 THEN '4|R$ 500 mil a 1 mi' ELSE '5|Acima de R$ 1 mi' END AS chave, count(*) AS valor
         FROM imoveis i WHERE ${ATIVO} AND finalidade = 'venda' AND preco > 0 GROUP BY 1 ORDER BY 1`,
    ),
    contar(
      `SELECT n::text AS chave, count(*) AS valor FROM imoveis i CROSS JOIN generate_series(1, 4) AS n
        WHERE ${ATIVO} AND i.tipo <> 'terreno' AND (n BETWEEN i.quartos_min AND i.quartos_max OR (n = 4 AND i.quartos_max >= 4)) GROUP BY 1 ORDER BY 1`,
    ),
    contar(
      `SELECT chave, count(*) AS valor FROM (
         SELECT CASE WHEN situacao = 'pronto' THEN '0|Pronto' WHEN entrega IS NOT NULL THEN '1|' || left(entrega, 4) ELSE '2|Sem data' END AS chave
           FROM imoveis i WHERE ${ATIVO} AND finalidade = 'venda'
       ) x GROUP BY 1 ORDER BY 1`,
    ),
    contar(`SELECT origem::text AS chave, count(*) AS valor FROM imoveis i WHERE ${ATIVO} GROUP BY 1 ORDER BY 2 DESC`),
    contar(
      `SELECT CASE WHEN atualizado_em >= current_date - 30 THEN '1|Até 30 dias' WHEN atualizado_em >= current_date - 90 THEN '2|31 a 90 dias'
                   WHEN atualizado_em >= current_date - 180 THEN '3|91 a 180 dias' WHEN atualizado_em >= current_date - 365 THEN '4|6 a 12 meses'
                   ELSE '5|Mais de 1 ano' END AS chave, count(*) AS valor
         FROM imoveis i WHERE ${ATIVO} GROUP BY 1 ORDER BY 1`,
    ),
    contar(
      `SELECT CASE WHEN n = 0 THEN '1|Sem fotos' WHEN n < 5 THEN '2|1 a 4 fotos' WHEN n < 10 THEN '3|5 a 9 fotos' WHEN n < 20 THEN '4|10 a 19 fotos' ELSE '5|20 ou mais' END AS chave, count(*) AS valor
         FROM (SELECT i.id, (SELECT count(*) FROM fotos f WHERE f.imovel_id = i.id) AS n FROM imoveis i WHERE ${ATIVO}) x GROUP BY 1 ORDER BY 1`,
    ),
    contar(
      `SELECT to_char(date_trunc('month', publicado_em), 'YYYY-MM') AS chave, count(*) AS valor
         FROM imoveis i WHERE ${ATIVO} AND publicado_em >= date_trunc('month', current_date) - interval '23 months' GROUP BY 1 ORDER BY 1`,
    ),
    banco()
      .query<{ chave: string; valor: number; imoveis: number }>(
        `SELECT c.nome AS chave, percentile_cont(0.5) WITHIN GROUP (ORDER BY i.preco / i.area_min)::float8 AS valor, count(*)::int AS imoveis
           ${LOCAL} WHERE ${ATIVO} AND i.finalidade = 'venda' AND i.tipo <> 'terreno' AND i.area_min > 0 AND i.preco > 0
          GROUP BY c.nome HAVING count(*) >= 3 ORDER BY 2 DESC`,
      )
      .then((r) => r.rows.map((x) => ({ chave: x.chave, valor: Number(x.valor), imoveis: x.imoveis }))),
  ])
  // Prefixo "n|" só serve para ordenar no SQL.
  const semPrefixo = (l: Contagem[]) => l.map((c) => ({ ...c, chave: c.chave.replace(/^\d\|/, '') }))
  return {
    tipo, finalidade, situacao, cidade, bairro, construtora,
    faixaDePreco: semPrefixo(faixaDePreco), quartos, entrega: semPrefixo(entrega), origem,
    atualizacao: semPrefixo(atualizacao), fotos: semPrefixo(fotos), cadastrosPorMes, precoPorM2PorCidade,
  }
}

// ---------- Qualidade do cadastro ----------

export interface ItemDeQualidade {
  chave: string
  titulo: string
  /** Por que isso importa para quem procura imóvel (e para o Google). */
  efeito: string
  falhas: number
  /** Primeiros imóveis com o problema. */
  exemplos: { id: string; nome: string; local: string }[]
}

const REGRAS: { chave: string; titulo: string; efeito: string; onde: string }[] = [
  { chave: 'coordenadas', titulo: 'Sem coordenadas no mapa', efeito: 'Não aparecem na busca por localização nem no Google Maps.', onde: 'i.latitude IS NULL' },
  { chave: 'logradouro', titulo: 'Sem endereço (logradouro)', efeito: 'A pessoa não sabe onde fica; reduz a confiança no anúncio.', onde: "COALESCE(btrim(i.logradouro), '') = ''" },
  { chave: 'plantas', titulo: 'Sem planta', efeito: 'Plantas aumentam o tempo na página e o interesse em visitar.', onde: 'NOT EXISTS (SELECT 1 FROM plantas p WHERE p.imovel_id = i.id) AND i.tipo <> \'terreno\'' },
  { chave: 'fotos', titulo: 'Menos de 5 fotos', efeito: 'Anúncios com poucas fotos recebem menos contatos.', onde: '(SELECT count(*) FROM fotos f WHERE f.imovel_id = i.id) < 5' },
  { chave: 'descricao', titulo: 'Sem descrição', efeito: 'Página com pouco texto rende menos no Google.', onde: 'cardinality(i.descricao) = 0' },
  { chave: 'construtora', titulo: 'Construtora "Não informado"', efeito: 'Não entra no filtro por construtora.', onde: 'co.padrao' },
  { chave: 'entrega', titulo: 'Em obra sem data de entrega', efeito: 'A data é uma das primeiras dúvidas de quem compra na planta.', onde: "i.entrega IS NULL AND i.situacao <> 'pronto' AND i.finalidade = 'venda'" },
  { chave: 'parados', titulo: 'Sem atualização há mais de 1 ano', efeito: 'Preço e disponibilidade podem estar desatualizados.', onde: 'i.atualizado_em < current_date - 365' },
  { chave: 'preco', titulo: 'Preço zerado ou sem valor', efeito: 'Aparece como "consulte" e some nos filtros de preço.', onde: 'i.preco <= 0' },
]

/** `exemplos`: quantos imóveis listar por problema (0 só conta). */
export async function qualidadeDoCadastro(exemplos = 30): Promise<{ ativos: number; itens: ItemDeQualidade[] }> {
  await exigirAdmin()
  const base = `FROM imoveis i JOIN bairros b ON b.id = i.bairro_id JOIN cidades c ON c.id = b.cidade_id JOIN construtoras co ON co.id = i.construtora_id WHERE ${ATIVO}`
  const [ativos, itens] = await Promise.all([
    banco().query<{ n: number }>(`SELECT count(*)::int AS n FROM imoveis i WHERE ${ATIVO}`).then((r) => r.rows[0]!.n),
    Promise.all(
      REGRAS.map(async (regra): Promise<ItemDeQualidade> => {
        const [{ rows: contagem }, lista] = await Promise.all([
          banco().query<{ n: number }>(`SELECT count(*)::int AS n ${base} AND ${regra.onde}`),
          exemplos > 0
            ? banco().query<{ id: string; nome: string; local: string }>(
                `SELECT i.id, i.nome, b.nome || ', ' || c.nome AS local ${base} AND ${regra.onde} ORDER BY i.atualizado_em, i.nome LIMIT $1`,
                [exemplos],
              )
            : { rows: [] },
        ])
        return { chave: regra.chave, titulo: regra.titulo, efeito: regra.efeito, falhas: contagem[0]!.n, exemplos: lista.rows }
      }),
    ),
  ])
  return { ativos, itens }
}

// ---------- Atividade do painel ----------

export interface AtividadeDoPainel {
  porDia: { dia: string; valor: number }[]
  porAcao: Contagem[]
  porAutor: Contagem[]
  recentes: { em: string; acao: string; autor: string; imovelId: string | null; imovel: string | null }[]
  administradores: { email: string; nome: string | null; ativo: boolean; ultimoAcesso: string | null }[]
  sessoesAbertas: number
}

export async function atividadeDoPainel(de: string, ate: string): Promise<AtividadeDoPainel> {
  await exigirAdmin()
  const periodo = `(a.em AT TIME ZONE 'America/Recife')::date BETWEEN $1 AND $2`
  const [porDia, porAcao, porAutor, recentes, administradores, sessoes] = await Promise.all([
    banco().query<{ dia: string; valor: number }>(
      `SELECT (a.em AT TIME ZONE 'America/Recife')::date::text AS dia, count(*)::int AS valor FROM auditoria a WHERE ${periodo} GROUP BY 1 ORDER BY 1`,
      [de, ate],
    ),
    contar(`SELECT a.acao AS chave, count(*) AS valor FROM auditoria a WHERE ${periodo} GROUP BY 1 ORDER BY 2 DESC`, [de, ate]),
    contar(`SELECT a.autor AS chave, count(*) AS valor FROM auditoria a WHERE ${periodo} GROUP BY 1 ORDER BY 2 DESC`, [de, ate]),
    banco().query<{ em: string; acao: string; autor: string; imovel_id: string | null; imovel: string | null }>(
      `SELECT a.em::text AS em, a.acao, a.autor, a.imovel_id, i.nome AS imovel FROM auditoria a LEFT JOIN imoveis i ON i.id = a.imovel_id
        WHERE ${periodo} ORDER BY a.em DESC LIMIT 40`,
      [de, ate],
    ),
    banco().query<{ email: string; nome: string | null; ativo: boolean; ultimo_acesso: string | null }>(
      'SELECT email, nome, ativo, ultimo_acesso::text AS ultimo_acesso FROM administradores ORDER BY ativo DESC, ultimo_acesso DESC NULLS LAST',
    ),
    banco().query<{ n: number }>('SELECT count(*)::int AS n FROM sessoes_admin WHERE expira_em > now()'),
  ])
  return {
    porDia: porDia.rows.map((r) => ({ dia: r.dia, valor: Number(r.valor) })),
    porAcao,
    porAutor,
    recentes: recentes.rows.map((r) => ({ em: r.em, acao: r.acao, autor: r.autor, imovelId: r.imovel_id, imovel: r.imovel })),
    administradores: administradores.rows.map((r) => ({ email: r.email, nome: r.nome, ativo: r.ativo, ultimoAcesso: r.ultimo_acesso })),
    sessoesAbertas: sessoes.rows[0]!.n,
  }
}
