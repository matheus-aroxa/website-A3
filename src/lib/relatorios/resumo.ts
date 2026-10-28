// Resumo diário da medição de uso: transforma os eventos brutos (tabela `eventos`) em contagens por dia e dimensão
// (tabela `resumo_diario`), que é o que os relatórios leem. Também apaga os eventos mais velhos que a retenção.
//
// Roda sozinho: ao abrir um relatório e, de tempos em tempos, quando chegam eventos novos. Não precisa de agendamento.
// Cada dia é refeito do zero (apaga e insere), então rodar de novo não duplica nada.
import 'server-only'
import { banco, transacao, type Cliente } from '@/lib/db'
import { hojeEmRecife } from '@/lib/coleta/dia'
import { RETENCAO_DIAS, TIPOS_CONVERSAO, TIPOS_INTERACAO } from '@/lib/coleta/tipos'

const FUSO = "'America/Recife'"

/** Uma linha por sessão do dia, com o que ela fez e com os atributos de quem a abriu. */
const SESSOES = `
  s AS (
    SELECT sessao,
           (array_agg(visitante))[1] AS visitante,
           count(*) FILTER (WHERE tipo = 'visita')::int AS paginas,
           count(*) FILTER (WHERE tipo NOT IN ('visita', 'erro', 'nao-encontrada'))::int AS outros,
           COALESCE(sum(tempo_s) FILTER (WHERE tipo = 'visita'), 0)::int AS tempo,
           COALESCE(bool_or(tipo = ANY($2)), false) AS converteu,
           COALESCE(bool_or(tipo = ANY($3)), false) AS interagiu,
           COALESCE(bool_or(tipo = 'visita' AND imovel_id IS NOT NULL), false) AS viu_imovel,
           (array_agg(canal) FILTER (WHERE nova_sessao))[1] AS canal,
           (array_agg(origem) FILTER (WHERE nova_sessao))[1] AS origem,
           (array_agg(campanha) FILTER (WHERE nova_sessao))[1] AS campanha,
           (array_agg(dispositivo) FILTER (WHERE nova_sessao))[1] AS dispositivo,
           (array_agg(navegador) FILTER (WHERE nova_sessao))[1] AS navegador,
           (array_agg(so) FILTER (WHERE nova_sessao))[1] AS so,
           (array_agg(idioma) FILTER (WHERE nova_sessao))[1] AS idioma,
           (array_agg(pais) FILTER (WHERE nova_sessao))[1] AS pais,
           (array_agg(estado) FILTER (WHERE nova_sessao))[1] AS estado,
           (array_agg(cidade) FILTER (WHERE nova_sessao))[1] AS cidade,
           (array_agg(caminho ORDER BY em, id) FILTER (WHERE tipo = 'visita'))[1] AS entrada,
           (array_agg(caminho ORDER BY em DESC, id DESC) FILTER (WHERE tipo = 'visita'))[1] AS saida
      FROM ev GROUP BY sessao
  ),
  s2 AS (SELECT *, (paginas = 1 AND outros = 0 AND tempo < 10) AS rejeicao FROM s)`

/** Colunas, na ordem do INSERT: dimensao, chave, imovel_id, visitas, visitantes, sessoes, rejeicoes, conversoes, eventos, tempo_s, valor. */
const porSessao = (dimensao: string, chave: string, onde = 'true') => `
  SELECT '${dimensao}', ${chave}, '', sum(paginas)::int, count(DISTINCT visitante)::int, count(*)::int,
         (count(*) FILTER (WHERE rejeicao))::int, (count(*) FILTER (WHERE converteu))::int, 0, sum(tempo)::bigint, 0::bigint
    FROM s2 WHERE ${onde} GROUP BY 2`

/** Visualizações de página agrupadas por `chave`. `eventos` é quantas tinham tempo e rolagem medidos (a base das médias). */
const porVisita = (dimensao: string, chave: string, imovel = "''", onde = 'true') => `
  SELECT '${dimensao}', ${chave}, ${imovel}, count(*)::int, count(DISTINCT visitante)::int, count(DISTINCT sessao)::int, 0, 0,
         (count(*) FILTER (WHERE tempo_s IS NOT NULL))::int, COALESCE(sum(tempo_s), 0)::bigint, COALESCE(sum(rolagem), 0)::bigint
    FROM ev WHERE tipo = 'visita' AND ${onde} GROUP BY 2, 3`

const porEvento = (dimensao: string, chave: string, imovel = "''", onde = 'true', valor = '0') => `
  SELECT '${dimensao}', ${chave}, ${imovel}, 0, count(DISTINCT visitante)::int, count(DISTINCT sessao)::int, 0, 0,
         count(*)::int, 0::bigint, (${valor})::bigint
    FROM ev WHERE ${onde} GROUP BY 2, 3`

const SEM_ACAO = "tipo NOT IN ('visita', 'busca', 'erro', 'nao-encontrada')"

const BLOCOS = [
  `SELECT 'total', '', '', sum(paginas)::int, count(DISTINCT visitante)::int, count(*)::int, (count(*) FILTER (WHERE rejeicao))::int,
          (count(*) FILTER (WHERE converteu))::int, 0, sum(tempo)::bigint, 0::bigint
     FROM s2 HAVING count(*) > 0`,
  porSessao('canal', "COALESCE(canal, 'direto')"),
  porSessao('origem', "canal || ':' || origem", 'origem IS NOT NULL'),
  porSessao('campanha', 'campanha', 'campanha IS NOT NULL'),
  porSessao('dispositivo', "COALESCE(dispositivo, 'desconhecido')"),
  porSessao('navegador', "COALESCE(navegador, 'desconhecido')"),
  porSessao('so', "COALESCE(so, 'desconhecido')"),
  porSessao('idioma', 'idioma', 'idioma IS NOT NULL'),
  porSessao('pais', 'pais', 'pais IS NOT NULL'),
  porSessao('estado', "pais || '-' || estado", 'pais IS NOT NULL AND estado IS NOT NULL'),
  porSessao('cidade', "cidade || '/' || COALESCE(estado, '')", 'cidade IS NOT NULL'),
  porSessao('entrada', 'entrada', 'entrada IS NOT NULL'),
  porSessao('saida', 'saida', 'saida IS NOT NULL'),
  // Funil: cada etapa é um subconjunto da anterior.
  `SELECT 'funil', etapa, '', 0, 0, n, 0, 0, 0, 0::bigint, 0::bigint FROM (
     SELECT '1-sessoes' AS etapa, count(*)::int AS n FROM s2 WHERE paginas > 0
     UNION ALL SELECT '2-viu-imovel', count(*)::int FROM s2 WHERE paginas > 0 AND viu_imovel
     UNION ALL SELECT '3-interagiu', count(*)::int FROM s2 WHERE paginas > 0 AND viu_imovel AND interagiu
     UNION ALL SELECT '4-contato', count(*)::int FROM s2 WHERE paginas > 0 AND viu_imovel AND converteu
     UNION ALL SELECT '5-contato-sem-imovel', count(*)::int FROM s2 WHERE converteu AND NOT viu_imovel
   ) f WHERE n > 0`,
  porVisita('hora', `extract(hour from em AT TIME ZONE ${FUSO})::int::text`),
  porVisita('pagina', 'caminho'),
  porVisita('tipo-pagina', "CASE WHEN caminho = '/' THEN 'home' WHEN caminho LIKE '/imoveis%' THEN 'busca' WHEN caminho LIKE '/imovel/%' THEN 'imovel' ELSE 'outras' END"),
  // Imóveis: visitas e, em sessões, quantas terminaram em contato sobre aquele imóvel.
  `SELECT 'imovel', '', v.imovel_id, v.visitas, v.visitantes, v.sessoes, 0, COALESCE(c.n, 0)::int, v.com_medida, v.tempo, v.rolagem
     FROM (
       SELECT imovel_id, count(*)::int AS visitas, count(DISTINCT visitante)::int AS visitantes, count(DISTINCT sessao)::int AS sessoes,
              (count(*) FILTER (WHERE tempo_s IS NOT NULL))::int AS com_medida, COALESCE(sum(tempo_s), 0)::bigint AS tempo,
              COALESCE(sum(rolagem), 0)::bigint AS rolagem
         FROM ev WHERE tipo = 'visita' AND imovel_id IS NOT NULL GROUP BY imovel_id
     ) v LEFT JOIN (
       SELECT imovel_id, count(DISTINCT sessao)::int AS n FROM ev WHERE tipo = ANY($2) AND imovel_id IS NOT NULL GROUP BY imovel_id
     ) c USING (imovel_id)`,
  porEvento('acao', "tipo || COALESCE(':' || rotulo, '')", "COALESCE(imovel_id, '')", SEM_ACAO),
  `SELECT 'busca', 'total', '', 0, count(DISTINCT visitante)::int, count(DISTINCT sessao)::int, 0, 0, count(*)::int, 0::bigint, COALESCE(sum(valor), 0)::bigint
     FROM ev WHERE tipo = 'busca' HAVING count(*) > 0`,
  `SELECT 'busca', 'sem-resultado', '', 0, count(DISTINCT visitante)::int, count(DISTINCT sessao)::int, 0, 0, count(*)::int, 0::bigint, 0::bigint
     FROM ev WHERE tipo = 'busca' AND valor = 0 HAVING count(*) > 0`,
  `SELECT 'busca-uso', f.item, '', 0, count(DISTINCT e.visitante)::int, count(DISTINCT e.sessao)::int, 0, 0, count(*)::int, 0::bigint, 0::bigint
     FROM ev e CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e.detalhe -> 'f', '[]'::jsonb)) AS f(item)
    WHERE e.tipo = 'busca' GROUP BY 2`,
  porEvento('busca-termo', "left(detalhe ->> 'q', 80)", "''", "tipo = 'busca' AND detalhe ->> 'q' IS NOT NULL"),
  porEvento(
    'busca-vazia',
    `left(COALESCE((SELECT string_agg(x, ' · ' ORDER BY x) FROM jsonb_array_elements_text(COALESCE(detalhe -> 'f', '[]'::jsonb)) x), '') ||
            COALESCE(' · “' || (detalhe ->> 'q') || '”', ''), 200)`,
    "''",
    "tipo = 'busca' AND valor = 0",
  ),
  porEvento('nao-encontrada', 'caminho', "''", "tipo = 'nao-encontrada'"),
  porEvento('erro', 'left(COALESCE(rotulo, \'erro\'), 150)', "''", "tipo = 'erro'"),
  `SELECT 'form-erro-campo', e.rotulo || ':' || c.campo, '', 0, count(DISTINCT e.visitante)::int, count(DISTINCT e.sessao)::int, 0, 0, count(*)::int, 0::bigint, 0::bigint
     FROM ev e CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e.detalhe -> 'campos', '[]'::jsonb)) AS c(campo)
    WHERE e.tipo = 'formulario-erro' GROUP BY 2`,
  // Velocidade (Core Web Vitals) por métrica, aparelho e nota. `valor` soma as medidas (CLS ×1000) para tirar a média.
  `SELECT 'vital', m.nome || ':' || COALESCE(s2.dispositivo, 'desconhecido') || ':' ||
            CASE WHEN m.v <= m.bom THEN 'bom' WHEN m.v <= m.ruim THEN 'medio' ELSE 'ruim' END,
          '', 0, 0, 0, 0, 0, count(*)::int, 0::bigint, round(sum(CASE WHEN m.nome = 'cls' THEN m.v * 1000 ELSE m.v END))::bigint
     FROM ev JOIN s2 ON s2.sessao = ev.sessao
    CROSS JOIN LATERAL (VALUES
      ('lcp',  (ev.vitais ->> 'lcp')::float8,  2500, 4000),
      ('cls',  (ev.vitais ->> 'cls')::float8,  0.1,  0.25),
      ('inp',  (ev.vitais ->> 'inp')::float8,  200,  500),
      ('fcp',  (ev.vitais ->> 'fcp')::float8,  1800, 3000),
      ('ttfb', (ev.vitais ->> 'ttfb')::float8, 800,  1800)
    ) AS m(nome, v, bom, ruim)
    WHERE ev.tipo = 'visita' AND ev.vitais IS NOT NULL AND m.v IS NOT NULL GROUP BY 2`,
  `SELECT 'vital-pagina', caminho, '', 0, 0, 0, 0, 0, count(*)::int, 0::bigint, round(sum((vitais ->> 'lcp')::float8))::bigint
     FROM ev WHERE tipo = 'visita' AND vitais ->> 'lcp' IS NOT NULL GROUP BY 2`,
]

const SQL_DIA = `
  WITH ev AS (SELECT * FROM eventos WHERE dia = $1), ${SESSOES}
  INSERT INTO resumo_diario (dia, dimensao, chave, imovel_id, visitas, visitantes, sessoes, rejeicoes, conversoes, eventos, tempo_s, valor)
  SELECT $1::date, x.* FROM (
    ${BLOCOS.join('\n    UNION ALL\n')}
  ) AS x(dimensao, chave, imovel_id, visitas, visitantes, sessoes, rejeicoes, conversoes, eventos, tempo_s, valor)
  WHERE x.chave IS NOT NULL`

/** Refaz o resumo de um dia. */
export async function resumirDia(cliente: Cliente, dia: string) {
  await cliente.query('DELETE FROM resumo_diario WHERE dia = $1', [dia])
  await cliente.query(SQL_DIA, [dia, TIPOS_CONVERSAO, TIPOS_INTERACAO])
}

let ultimaAtualizacao = 0

/**
 * Atualiza o resumo de hoje e de ontem, resume os dias que ainda não foram resumidos e apaga os eventos que passaram da retenção.
 * `idadeMaximaS`: não repete se já rodou há menos que isso neste servidor.
 */
export async function atualizarResumo(idadeMaximaS = 30) {
  if (Date.now() - ultimaAtualizacao < idadeMaximaS * 1000) return
  ultimaAtualizacao = Date.now()
  const hoje = hojeEmRecife()
  await transacao(async (cliente) => {
    // Duas execuções ao mesmo tempo (dois servidores) apenas repetiriam o trabalho: a segunda desiste.
    const { rows: trava } = await cliente.query<{ ok: boolean }>('SELECT pg_try_advisory_xact_lock(hashtext($1)) AS ok', ['resumo-diario'])
    if (!trava[0]!.ok) return
    const { rows } = await cliente.query<{ dia: string }>(
      `SELECT DISTINCT e.dia::text AS dia FROM eventos e
        WHERE e.dia >= $1::date - 1
           OR NOT EXISTS (SELECT 1 FROM resumo_diario r WHERE r.dia = e.dia AND r.dimensao = 'total')
        ORDER BY 1`,
      [hoje],
    )
    for (const { dia } of rows) await resumirDia(cliente, dia)
    // Só apaga o evento bruto de um dia que já tem resumo.
    await cliente.query(
      `DELETE FROM eventos e WHERE e.dia < $1::date - $2::int
          AND EXISTS (SELECT 1 FROM resumo_diario r WHERE r.dia = e.dia AND r.dimensao = 'total')`,
      [hoje, RETENCAO_DIAS],
    )
    await cliente.query("DELETE FROM sal_visitantes WHERE dia < $1::date - 2", [hoje])
  })
}

/** Primeiro e último dia com dados no resumo (limita os períodos que o seletor oferece). */
export async function intervaloDosDados() {
  const { rows } = await banco().query<{ de: string | null; ate: string | null }>(
    "SELECT min(dia)::text AS de, max(dia)::text AS ate FROM resumo_diario WHERE dimensao = 'total'",
  )
  return { de: rows[0]!.de, ate: rows[0]!.ate }
}
