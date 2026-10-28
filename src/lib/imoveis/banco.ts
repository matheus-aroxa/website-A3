// Acesso ao catálogo no banco (db/schema.sql): leitura para o site e para o painel, e as gravações do painel.
// Sem cache aqui: o cache do site fica em repositorio.ts, e o painel sempre lê o estado atual.
import 'server-only'
import { banco, transacao, type Cliente } from '@/lib/db'
import { altDaFoto, nomeDoLocal, slugificar } from './formato'
import type { StatusImovel, Vitrine } from './painel'
import type { Finalidade, Foto, Imovel, Planta, Situacao, TipoImovel } from './tipos'

export interface RegistroImovel {
  imovel: Imovel
  status: StatusImovel
  /** Cadastrado no painel (não veio da importação do sistema anterior). */
  criado: boolean
}

// ---------- Leitura ----------

export const CONSULTA_SITE = `
  SELECT i.id, i.codigo, i.slug, i.nome, i.tipo, i.finalidade, i.situacao,
         c.nome AS cidade, c.slug AS cidade_slug, c.uf, b.nome AS bairro, b.slug AS bairro_slug,
         i.logradouro, i.latitude, i.longitude,
         i.preco::float8 AS preco,
         i.area_min::float8 AS area_min, i.area_max::float8 AS area_max,
         i.quartos_min, i.quartos_max, i.banheiros_min, i.banheiros_max, i.vagas_min, i.vagas_max,
         i.suites_min, i.suites_max, i.entrega, i.mcmv, i.destaque, i.heroi, i.chamada, co.id AS construtora_id, co.nome AS construtora, co.slug AS construtora_slug, i.unidades,
         i.descricao, i.lazer, i.proximidades,
         to_char(i.publicado_em, 'YYYY-MM-DD') AS publicado_em,
         to_char(i.atualizado_em, 'YYYY-MM-DD') AS atualizado_em,
         i.status, i.origem,
         COALESCE((
           SELECT json_agg(json_build_object(
             'src', f.src, 'width', f.largura, 'height', f.altura, 'alt', f.alt,
             'legenda', f.legenda, 'blurDataURL', f.blur_data_url, 'capa', f.capa) ORDER BY f.posicao)
             FROM fotos f WHERE f.imovel_id = i.id), '[]'::json) AS fotos,
         COALESCE((
           SELECT json_agg(json_build_object(
             'titulo', p.titulo, 'descricao', p.descricao, 'area', p.area::float8,
             'src', p.foto_src, 'width', p.foto_largura, 'height', p.foto_altura, 'alt', p.foto_alt) ORDER BY p.posicao)
             FROM plantas p WHERE p.imovel_id = i.id), '[]'::json) AS plantas
    FROM imoveis i
    JOIN bairros b ON b.id = i.bairro_id
    JOIN cidades c ON c.id = b.cidade_id
    JOIN construtoras co ON co.id = i.construtora_id`

interface LinhaFoto {
  src: string
  width: number
  height: number
  alt: string
  legenda: string | null
  blurDataURL: string | null
  capa: boolean
}

interface LinhaPlanta {
  titulo: string
  descricao: string
  area: number
  src: string
  width: number
  height: number
  alt: string
}

export interface Linha {
  id: string
  codigo: string
  slug: string
  nome: string
  tipo: TipoImovel
  finalidade: Finalidade
  situacao: Situacao
  cidade: string
  cidade_slug: string
  uf: string
  bairro: string
  bairro_slug: string
  logradouro: string | null
  latitude: number | null
  longitude: number | null
  preco: number
  area_min: number
  area_max: number
  quartos_min: number
  quartos_max: number
  banheiros_min: number
  banheiros_max: number
  vagas_min: number | null
  vagas_max: number | null
  suites_min: number | null
  suites_max: number | null
  entrega: string | null
  mcmv: boolean
  destaque: boolean
  heroi: boolean
  chamada: string
  construtora_id: number
  construtora: string
  construtora_slug: string
  unidades: string | null
  descricao: string[]
  lazer: string[]
  proximidades: string[]
  publicado_em: string
  atualizado_em: string
  status: StatusImovel
  origem: 'supremo' | 'painel'
  fotos: LinhaFoto[]
  plantas: LinhaPlanta[]
}

function paraFoto(f: LinhaFoto, alt = f.alt): Foto {
  return {
    src: f.src,
    width: f.width,
    height: f.height,
    alt,
    ...(f.legenda ? { legenda: f.legenda } : {}),
    ...(f.blurDataURL ? { blurDataURL: f.blurDataURL } : {}),
  }
}

export function paraImovel(l: Linha): Imovel {
  const bairro = nomeDoLocal(l.bairro)
  const capa = l.fotos.find((f) => f.capa)
  const plantas: Planta[] = l.plantas.map((p) => ({
    titulo: p.titulo,
    descricao: p.descricao,
    area: p.area,
    foto: { src: p.src, width: p.width, height: p.height, alt: p.alt },
  }))
  return {
    id: l.id,
    codigo: l.codigo,
    slug: l.slug,
    nome: l.nome,
    tipo: l.tipo,
    finalidade: l.finalidade,
    situacao: l.situacao,
    local: {
      bairro,
      bairroSlug: l.bairro_slug,
      cidade: l.cidade,
      cidadeSlug: l.cidade_slug,
      uf: l.uf,
      ...(l.logradouro ? { logradouro: l.logradouro } : {}),
      ...(l.latitude !== null && l.longitude !== null ? { geo: { lat: l.latitude, lng: l.longitude } } : {}),
    },
    preco: l.preco,
    area: { min: l.area_min, max: l.area_max },
    quartos: { min: l.quartos_min, max: l.quartos_max },
    suites: l.suites_min === null || l.suites_max === null ? undefined : { min: l.suites_min, max: l.suites_max },
    banheiros: { min: l.banheiros_min, max: l.banheiros_max },
    vagas: l.vagas_min === null || l.vagas_max === null ? null : { min: l.vagas_min, max: l.vagas_max },
    entrega: l.entrega ?? undefined,
    mcmv: l.mcmv,
    destaque: l.destaque,
    heroi: l.heroi,
    publicadoEm: l.publicado_em,
    atualizadoEm: l.atualizado_em,
    chamada: l.chamada,
    descricao: l.descricao,
    fotos: l.fotos.map((f, i) => paraFoto(f, altDaFoto({ ...l, bairro }, i))),
    capa: capa ? paraFoto(capa, altDaFoto({ ...l, bairro }, l.fotos.indexOf(capa))) : undefined,
    plantas,
    lazer: l.lazer,
    proximidades: l.proximidades,
    construtora: { id: l.construtora_id, nome: l.construtora, slug: l.construtora_slug },
    unidades: l.unidades ?? undefined,
  }
}

function paraRegistro(l: Linha): RegistroImovel {
  const imovel = paraImovel(l)
  const criado = l.origem === 'painel'
  return { imovel, status: l.status, criado }
}

export async function obterRegistro(id: string): Promise<RegistroImovel | null> {
  const { rows } = await banco().query<Linha>(`${CONSULTA_SITE} WHERE i.id = $1`, [id])
  return rows[0] ? paraRegistro(rows[0]) : null
}

export interface EstadoVitrine {
  /** Falso enquanto ninguém mexeu na vitrine: valem as marcações originais do catálogo (`heroi` e `destaque` dos imóveis). */
  personalizada: boolean
  vitrine: Vitrine
}

export async function obterVitrine(): Promise<EstadoVitrine> {
  const [config, destaques] = await Promise.all([
    banco().query<{ personalizada: boolean; heroi_id: string | null }>('SELECT personalizada, heroi_id FROM vitrine_config'),
    banco().query<{ imovel_id: string }>('SELECT imovel_id FROM vitrine_destaques ORDER BY posicao'),
  ])
  const linha = config.rows[0]
  return {
    personalizada: linha?.personalizada ?? false,
    vitrine: { heroi: linha?.heroi_id ?? null, destaques: destaques.rows.map((d) => d.imovel_id) },
  }
}

/** Muda sempre que o catálogo muda (e quando imóveis são criados ou removidos). */
export async function versaoDoCatalogo(): Promise<string> {
  const { rows } = await banco().query<{ versao: string }>(
    `SELECT concat(count(*), ':', coalesce(max(alterado_em), 'epoch')::text) AS versao FROM imoveis`,
  )
  return rows[0]!.versao
}

// ---------- Gravação ----------

/**
 * Slug de uma cidade nova. O slug é único no banco inteiro, e há cidades com o mesmo nome em estados diferentes:
 * se o slug já é de uma cidade de outro estado, leva a sigla (ex.: bom-jesus-pb).
 */
export async function slugDaCidade(nome: string, uf: string) {
  const slug = slugificar(nome)
  const { rows } = await banco().query<{ uf: string }>('SELECT uf FROM cidades WHERE slug = $1', [slug])
  return rows[0] && rows[0].uf !== uf ? `${slug}-${uf.toLowerCase()}` : slug
}

/** Cidade e bairro pelo slug; cria os que ainda não existem. */
async function idDoBairro(cliente: Cliente, local: Imovel['local']): Promise<number> {
  const cidade = await cliente.query<{ id: number }>(
    `INSERT INTO cidades (nome, slug, uf) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
    [local.cidade, local.cidadeSlug, local.uf],
  )
  const bairro = await cliente.query<{ id: number }>(
    `INSERT INTO bairros (cidade_id, nome, slug) VALUES ($1, $2, $3)
     ON CONFLICT (cidade_id, slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
    [cidade.rows[0]!.id, local.bairro, local.bairroSlug],
  )
  return bairro.rows[0]!.id
}

async function gravarFotos(cliente: Cliente, id: string, fotos: Foto[], capa: Foto | undefined) {
  await cliente.query('DELETE FROM fotos WHERE imovel_id = $1', [id])
  if (!fotos.length) return
  await cliente.query(
    `INSERT INTO fotos (imovel_id, posicao, src, largura, altura, alt, legenda, blur_data_url, capa)
     SELECT $1, * FROM unnest($2::int[], $3::text[], $4::int[], $5::int[], $6::text[], $7::text[], $8::text[], $9::bool[])`,
    [
      id,
      fotos.map((_, i) => i),
      fotos.map((f) => f.src),
      fotos.map((f) => f.width),
      fotos.map((f) => f.height),
      fotos.map((f) => f.alt),
      fotos.map((f) => f.legenda ?? null),
      fotos.map((f) => f.blurDataURL ?? null),
      fotos.map((f) => capa?.src === f.src),
    ],
  )
}

/** Valores das colunas de `imoveis` que o painel pode mudar, na mesma ordem de COLUNAS_EDITAVEIS. */
function valoresEditaveis(im: Imovel, bairroId: number) {
  return [
    im.nome, im.tipo, im.finalidade, im.situacao, bairroId, im.local.logradouro ?? null,
    im.local.geo?.lat ?? null, im.local.geo?.lng ?? null, im.preco,
    im.area.min, im.area.max, im.quartos.min, im.quartos.max, im.banheiros.min, im.banheiros.max,
    im.vagas?.min ?? null, im.vagas?.max ?? null, im.suites?.min ?? null, im.suites?.max ?? null, im.entrega ?? null, im.mcmv,
    im.chamada, im.construtora.id, im.unidades ?? null, im.descricao, im.lazer, im.proximidades,
  ]
}

const COLUNAS_EDITAVEIS = [
  'nome', 'tipo', 'finalidade', 'situacao', 'bairro_id', 'logradouro', 'latitude', 'longitude', 'preco',
  'area_min', 'area_max', 'quartos_min', 'quartos_max', 'banheiros_min', 'banheiros_max',
  'vagas_min', 'vagas_max', 'suites_min', 'suites_max', 'entrega', 'mcmv', 'chamada', 'construtora_id', 'unidades',
  'descricao', 'lazer', 'proximidades',
]

export interface Auditoria {
  autor: string
  acao: string
  imovelId?: string
  campos?: unknown
}

export async function registrar(cliente: Cliente, { autor, acao, imovelId, campos }: Auditoria) {
  await cliente.query('INSERT INTO auditoria (imovel_id, acao, autor, campos) VALUES ($1, $2, $3, $4)', [
    imovelId ?? null,
    acao,
    autor,
    campos === undefined ? null : JSON.stringify(campos),
  ])
}

/** Regrava os campos editáveis do imóvel (id, código e slug não mudam), inclusive `atualizadoEm`. */
export async function gravarImovel(imovel: Imovel, auditoria: Auditoria) {
  await transacao(async (cliente) => {
    const bairroId = await idDoBairro(cliente, imovel.local)
    const sets = COLUNAS_EDITAVEIS.map((coluna, i) => `${coluna} = $${i + 2}`)
    const { rowCount } = await cliente.query(
      `UPDATE imoveis SET ${sets.join(', ')}, atualizado_em = $${COLUNAS_EDITAVEIS.length + 2} WHERE id = $1`,
      [imovel.id, ...valoresEditaveis(imovel, bairroId), imovel.atualizadoEm],
    )
    if (!rowCount) throw new Error(`Imóvel ${imovel.id} não existe.`)
    await gravarFotos(cliente, imovel.id, imovel.fotos, imovel.capa)
    await registrar(cliente, { ...auditoria, imovelId: imovel.id })
  })
}

/** Cadastra um imóvel criado no painel. */
export async function inserirImovel(imovel: Imovel, auditoria: Auditoria) {
  await transacao(async (cliente) => {
    const bairroId = await idDoBairro(cliente, imovel.local)
    const colunas = ['id', 'codigo', 'slug', 'origem', 'publicado_em', 'atualizado_em', ...COLUNAS_EDITAVEIS]
    const marcas = colunas.map((_, i) => `$${i + 1}`)
    await cliente.query(`INSERT INTO imoveis (${colunas.join(', ')}) VALUES (${marcas.join(', ')})`, [
      imovel.id, imovel.codigo, imovel.slug, 'painel', imovel.publicadoEm, imovel.atualizadoEm,
      ...valoresEditaveis(imovel, bairroId),
    ])
    await gravarFotos(cliente, imovel.id, imovel.fotos, imovel.capa)
    await registrar(cliente, { ...auditoria, imovelId: imovel.id })
  })
}

/** Slugs já usados (de imóveis publicados e desativados). */
export async function slugsEmUso(): Promise<Set<string>> {
  const { rows } = await banco().query<{ slug: string }>('SELECT slug FROM imoveis')
  return new Set(rows.map((r) => r.slug))
}

export type AcaoStatus = 'desativar' | 'ativar'

const STATUS_DA_ACAO: Record<AcaoStatus, StatusImovel> = {
  desativar: 'inativo',
  ativar: 'ativo',
}

/** Desativar tira o imóvel do site, da busca e da vitrine; ele continua no painel e pode ser reativado. */
export async function mudarStatusNoBanco(id: string, acao: AcaoStatus, autor: string) {
  await transacao(async (cliente) => {
    await cliente.query('UPDATE imoveis SET status = $2 WHERE id = $1', [id, STATUS_DA_ACAO[acao]])
    await registrar(cliente, { autor, acao, imovelId: id })
  })
}

/**
 * Apaga o imóvel do banco, com fotos, plantas e lugar na vitrine (as chaves estrangeiras cuidam disso).
 * Devolve os endereços das imagens que ele tinha, para o chamador apagá-las do S3.
 * A auditoria guarda quem apagou e o nome (a ligação com o imóvel some junto com ele).
 */
export async function excluirImovelNoBanco(id: string, autor: string): Promise<string[]> {
  return transacao(async (cliente) => {
    const { rows } = await cliente.query<{ src: string }>(
      `SELECT src FROM fotos WHERE imovel_id = $1 UNION SELECT foto_src FROM plantas WHERE imovel_id = $1`,
      [id],
    )
    const imovel = await cliente.query<{ nome: string; codigo: string }>('SELECT nome, codigo FROM imoveis WHERE id = $1', [id])
    await cliente.query('DELETE FROM imoveis WHERE id = $1', [id])
    await registrar(cliente, { autor, acao: 'excluir', campos: { id, ...imovel.rows[0] } })
    return rows.map((r) => r.src)
  })
}

export async function gravarVitrine(vitrine: Vitrine, autor: string) {
  await transacao(async (cliente) => {
    await cliente.query('UPDATE vitrine_config SET personalizada = true, heroi_id = $1', [vitrine.heroi])
    await cliente.query('DELETE FROM vitrine_destaques')
    if (vitrine.destaques.length) {
      await cliente.query(
        'INSERT INTO vitrine_destaques (posicao, imovel_id) SELECT * FROM unnest($1::int[], $2::text[])',
        [vitrine.destaques.map((_, i) => i), vitrine.destaques],
      )
    }
    await registrar(cliente, { autor, acao: 'vitrine', campos: vitrine })
  })
}
