// Grava os eventos da medição de uso (db/relatorios.sql). Chamado pelo endpoint /api/coleta e pelas ações dos formulários.
//
// Privacidade: o código do visitante é um hash de IP + navegador + um "sal" que muda todo dia (e é apagado em 2 dias).
// O IP, o User-Agent e o sal nunca são gravados em eventos. País, estado e cidade vêm dos cabeçalhos da Vercel.
import 'server-only'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { banco, transacao } from '@/lib/db'
import { atualizarResumo } from '@/lib/relatorios/resumo'
import { site } from '@/lib/site'
import { ehRobo, lerAgente } from './agente'
import { hojeEmRecife } from './dia'
import { classificarOrigem } from './origem'
import { SESSAO_MINUTOS, type Carga, type CargaEvento, type CargaSaida, type Detalhe } from './tipos'

// ---------- Sal do dia ----------

const sais = new Map<string, string>()

async function salDoDia(dia: string) {
  const guardado = sais.get(dia)
  if (guardado) return guardado
  await banco().query('INSERT INTO sal_visitantes (dia, sal) VALUES ($1, $2) ON CONFLICT (dia) DO NOTHING', [dia, randomBytes(24).toString('base64url')])
  const { rows } = await banco().query<{ sal: string }>('SELECT sal FROM sal_visitantes WHERE dia = $1', [dia])
  const sal = rows[0]!.sal
  sais.clear()
  sais.set(dia, sal)
  return sal
}

// ---------- Slug -> id do imóvel ----------

let imoveis = { mapa: new Map<string, string>(), carregadoEm: 0 }

async function idDoImovel(slug: string | undefined) {
  if (!slug) return undefined
  const achado = imoveis.mapa.get(slug)
  if (achado) return achado
  // Não achou: pode ser um imóvel cadastrado agora. Recarrega, no máximo uma vez por minuto.
  if (Date.now() - imoveis.carregadoEm < 60_000) return undefined
  const { rows } = await banco().query<{ slug: string; id: string }>('SELECT slug, id FROM imoveis')
  imoveis = { mapa: new Map(rows.map((r) => [r.slug, r.id])), carregadoEm: Date.now() }
  return imoveis.mapa.get(slug)
}

/** Imóvel da página: /imovel/[slug]. */
const slugDoCaminho = (caminho: string) => /^\/imovel\/([^/]+)$/.exec(caminho)?.[1]

// ---------- Limite por visitante ----------

const POR_MINUTO = 90
const contagens = new Map<string, { inicio: number; n: number }>()

function dentroDoLimite(visitante: string) {
  const agora = Date.now()
  if (contagens.size > 5000) for (const [k, v] of contagens) if (agora - v.inicio > 60_000) contagens.delete(k)
  const c = contagens.get(visitante)
  if (!c || agora - c.inicio > 60_000) {
    contagens.set(visitante, { inicio: agora, n: 1 })
    return true
  }
  return ++c.n <= POR_MINUTO
}

// ---------- Gravação ----------

const hostsDoSite = (host: string | null) => {
  const doSite = new URL(site.url).hostname.replace(/^www\./, '')
  return [...new Set([doSite, (host ?? '').split(':')[0]!.replace(/^www\./, '')].filter(Boolean))]
}

const primeiro = (v: string | null) => v?.split(',')[0]?.trim() ?? ''

function lerGeo(h: Headers) {
  let cidade: string | null = null
  try {
    cidade = decodeURIComponent(h.get('x-vercel-ip-city') ?? '').slice(0, 80) || null
  } catch {
    // Cabeçalho malformado: sem cidade.
  }
  return {
    pais: h.get('x-vercel-ip-country')?.slice(0, 2).toUpperCase() || null,
    estado: h.get('x-vercel-ip-country-region')?.slice(0, 8).toUpperCase() || null,
    cidade,
  }
}

export interface Entrada {
  carga: Carga
  cabecalhos: Headers
  /** Id do imóvel quando quem chama já o conhece (ações dos formulários). */
  imovelId?: string
}

/** Registra um evento. Nunca lança: a medição não pode atrapalhar quem navega. */
export async function registrarCarga({ carga, cabecalhos, imovelId }: Entrada): Promise<void> {
  try {
    if (carga.t === 'saida') return await completarSaida(carga)
    const agente = cabecalhos.get('user-agent') ?? ''
    if (ehRobo(agente)) return
    const ip = cabecalhos.get('x-real-ip') ?? primeiro(cabecalhos.get('x-forwarded-for')) ?? ''
    const dia = hojeEmRecife()
    const visitante = createHash('sha256')
      .update(`${await salDoDia(dia)}|${ip}|${agente}`)
      .digest('hex')
      .slice(0, 20)
    if (!dentroDoLimite(visitante)) return
    await gravar(carga, visitante, agente, cabecalhos, imovelId)
    // De vez em quando uma visita também refaz o resumo diário e apaga os eventos antigos, para não depender de alguém abrir os relatórios.
    if (carga.t === 'visita' && Math.random() < 0.005) await atualizarResumo(600)
  } catch (erro) {
    console.error('[coleta]', erro)
  }
}

async function gravar(c: CargaEvento, visitante: string, agente: string, cabecalhos: Headers, imovelConhecido?: string) {
  const imovel_id = imovelConhecido ?? (await idDoImovel(c.i ?? slugDoCaminho(c.c)))
  const { dispositivo, navegador, so } = lerAgente(agente, c.w)
  const origem = classificarOrigem({ referencia: c.ref, query: c.q, agente, hostsDoSite: hostsDoSite(cabecalhos.get('host')) })
  const geo = lerGeo(cabecalhos)

  await transacao(async (cliente) => {
    // Eventos do mesmo visitante chegam quase juntos (a visita e a busca, por exemplo): a trava evita duas sessões.
    await cliente.query('SELECT pg_advisory_xact_lock(hashtext($1))', [visitante])
    const aberta = await cliente.query<{ sessao: string }>(
      `SELECT sessao FROM eventos WHERE visitante = $1 AND em > now() - make_interval(mins => $2) ORDER BY em DESC LIMIT 1`,
      [visitante, SESSAO_MINUTOS],
    )
    const sessao = aberta.rows[0]?.sessao ?? randomUUID()
    const nova = aberta.rows.length === 0
    await cliente.query(
      `INSERT INTO eventos (tipo, visitante, sessao, nova_sessao, pv, caminho, imovel_id, rotulo, valor, detalhe,
                            canal, origem, campanha, dispositivo, navegador, so, idioma, pais, estado, cidade)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (pv) WHERE pv IS NOT NULL DO NOTHING`,
      [
        c.t, visitante, sessao, nova, c.pv ?? null, c.c, imovel_id ?? null, c.r ?? null, c.v ?? null,
        c.d ? JSON.stringify(c.d satisfies Detalhe) : null,
        ...(nova
          ? [origem.canal, origem.origem, origem.campanha, dispositivo, navegador, so, c.l?.slice(0, 2).toLowerCase() ?? null, geo.pais, geo.estado, geo.cidade]
          : Array(10).fill(null)),
      ],
    )
  })
}

/** A saída completa a linha da visita; vários envios (a aba volta e sai de novo) ficam com o maior valor. */
async function completarSaida(c: CargaSaida) {
  await banco().query(
    `UPDATE eventos
        SET tempo_s = GREATEST(COALESCE(tempo_s, 0), $2),
            rolagem = GREATEST(COALESCE(rolagem, 0), $3),
            vitais = CASE WHEN $4::jsonb = '{}'::jsonb THEN vitais ELSE COALESCE(vitais, '{}'::jsonb) || $4::jsonb END
      WHERE pv = $1`,
    [c.pv, c.s, c.p, JSON.stringify(c.w ?? {})],
  )
}
