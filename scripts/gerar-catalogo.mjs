// Converte a exportação do painel Supremo (a3_painel_supremo.json) no catálogo do site
// (src/lib/crm/supremo/catalogo.json). Rode de novo sempre que houver uma nova exportação:
//   node scripts/gerar-catalogo.mjs [caminho-do-json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entrada = resolve(process.argv[2] ?? `${raiz}/a3_painel_supremo.json`)
const saida = `${raiz}/src/lib/crm/supremo/catalogo.json`

const MAX_FOTOS = 30
const CIDADES = [
  'Recife', 'Paulista', 'Olinda', 'Jaboatão dos Guararapes', 'Camaragibe', 'Igarassu', 'Ipojuca',
  'Tamandaré', 'Cabo de Santo Agostinho', 'Gravatá', 'São Lourenço da Mata', 'Abreu e Lima', 'Maragogi',
]
const SITUACAO = { 0: 'breve-lancamento', 1: 'lancamento', 2: 'em-construcao', 3: 'pronto' }
const SITUACAO_TEXTO = {
  'breve lançamento': 'breve-lancamento', 'pré-lançamento': 'breve-lancamento', lançamento: 'lancamento',
  'em construção': 'em-construcao', 'pronto pra morar': 'pronto',
}
const TIPO = { Apartamento: 'apartamento', Casa: 'casa-condominio', 'Casa de Condomínio': 'casa-condominio', 'Lotes de Condomínio': 'terreno', 'Lotes de Bairro': 'terreno' }

const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const PEQUENAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
const titulo = (t) =>
  t.trim().split(/\s+/).map((p, i) => (i && PEQUENAS.has(p.toLowerCase()) ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase())).join(' ')
const semCaixaAlta = (t) => (t === t.toUpperCase() && /[A-ZÀ-Ú]/.test(t) ? titulo(t) : t)

const numero = (t) => Number(String(t).replace(/\./g, '').replace(',', '.'))
const numeros = (t) => (t.match(/\d+(?:,\d+)?/g) ?? []).map(numero)
const faixa = (valores) => (valores.length ? { min: Math.min(...valores), max: Math.max(...valores) } : null)
const data = (t) => (t ? String(t).slice(0, 10) : undefined)

function htmlParaParagrafos(html = '') {
  const texto = html
    .replace(/<(br|\/div|\/p|\/li|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  return texto
    .split('\n')
    .map((l) => l.replace(/^[\s•\-–*✨🏡🏊📍💰✅🔑\p{Extended_Pictographic}️]+/u, '').replace(/\*+$/, '').replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 2)
    .slice(0, 14)
}

/** Lê o cabeçalho da ficha ("Nome (COD: 1) endereço A PARTIR DE R$ ... Tipo ... Estágio ... Previsão de Entrega ..."). */
function lerFicha(ficha = '') {
  const cab = ficha.slice(0, ficha.search(/DESCRIÇÃO|GALERIAS DE FOTOS|ESTÁGIOS DA OBRA/) > 0 ? ficha.search(/DESCRIÇÃO|GALERIAS DE FOTOS|ESTÁGIOS DA OBRA/) : 600)
  const preco = cab.match(/(A PARTIR DE|MENSALIDADE) R\$ ([\d.]+)(?: \+\d+ Fotos)?\s*(.*?) Tipo /)
  const local = cab.match(/\(COD: \d+\)\s*(.*?)\s*(?:A PARTIR DE|MENSALIDADE)/)?.[1] ?? ''
  const resto = preco?.[3] ?? ''
  const inicioQuartos = resto.search(/\d+(?: (?:e|ou|a) \d+)? Quartos?\b/)
  const area = numeros(inicioQuartos >= 0 ? resto.slice(0, inicioQuartos) : resto.split(/Quarto/)[0]).filter((n) => n >= 10)
  const antes = (re) => numeros(resto.match(re)?.[1] ?? '')
  return {
    local,
    area,
    quartos: antes(/([\d]+(?: (?:e|ou|a) \d+)?) Quartos?/),
    banheiros: antes(/([\d]+(?: (?:e|ou|a) \d+)?) Banheiros?/),
    vagas: antes(/([\d]+(?: (?:e|ou|a) \d+)?) Vagas?/),
    entrega: cab.match(/Previsão de Entrega (\d\d)\/(\d\d)\/(\d{4})/)?.slice(2, 4).reverse().join('-'),
    mensalidade: preco?.[1] === 'MENSALIDADE',
  }
}

function resolverLocal(dados, localFicha) {
  let cidade = dados.bre_nome && norm(dados.bre_nome) !== 'pernambuco' ? titulo(dados.bre_nome) : null
  if (!cidade) cidade = CIDADES.find((c) => norm(localFicha).includes(norm(c))) ?? null
  const uf = (dados.bro_sigla || (cidade === 'Maragogi' ? 'AL' : 'PE')).toUpperCase()
  let bairro = dados.brs_nome ? titulo(dados.brs_nome) : null
  if (!bairro && cidade) {
    const partes = localFicha.replace(/\/[A-Z]{2}\s*$/, '').split(',').map((p) => p.trim()).filter(Boolean)
    const i = partes.findIndex((p) => norm(p) === norm(cidade))
    const candidato = i > 0 ? partes[i - 1] : partes.length > 1 ? partes[partes.length - 1] : null
    if (candidato && !/\d|^(rua|r\.|av|avenida|via|travessa|estrada)\b/i.test(candidato) && norm(candidato) !== norm(cidade)) bairro = titulo(candidato)
  }
  return {
    cidade: cidade ?? 'Pernambuco',
    bairro: bairro ?? (cidade ? 'Centro' : 'A confirmar'),
    uf,
    logradouro: (dados.vem_endereco ?? '').split(' - ')[0].trim() || undefined,
  }
}

function montar({ id, codigo, nome, tipo, finalidade, situacao, local, preco, area, quartos, banheiros, vagas, entrega, mcmv, cadastro, edicao, descricao, fotos, suites }) {
  const nomeBase = semCaixaAlta(nome.trim().replace(/\s*[-–]\s*(aluguel|repasse)\s*$/i, (m) => m).replace(/^BREVE LANÇAMENTO\s*-\s*/i, ''))
  const tipoTexto = { apartamento: 'Apartamentos', 'casa-condominio': 'Casas', terreno: 'Terrenos' }[tipo]
  const quartosTexto = tipo === 'terreno' || !quartos.max ? '' : ` de ${quartos.min === quartos.max ? quartos.max : `${quartos.min} e ${quartos.max}`} quarto${quartos.max > 1 ? 's' : ''}`
  return {
    id: String(id), codigo, slug: slug(`${nomeBase} ${local.bairro} ${local.cidade}`), nome: nomeBase,
    tipo, finalidade, situacao,
    local: { bairro: local.bairro, bairroSlug: slug(local.bairro), cidade: local.cidade, cidadeSlug: slug(local.cidade), uf: local.uf, ...(local.logradouro && { logradouro: local.logradouro }) },
    preco, area, quartos, ...(suites && { suites }), banheiros, vagas,
    ...(entrega && { entrega }), mcmv, destaque: false,
    publicadoEm: data(cadastro) ?? '2026-01-01', atualizadoEm: data(edicao) ?? data(cadastro) ?? '2026-01-01',
    chamada: `${finalidade === 'aluguel' ? `${tipoTexto} para alugar` : tipoTexto}${quartosTexto} em ${local.bairro}, ${local.cidade} – ${local.uf}`,
    descricao, fotos, plantas: [], lazer: [], proximidades: [],
  }
}

const bruto = JSON.parse(readFileSync(entrada, 'utf8'))
const ignorados = []
const catalogo = []

for (const e of bruto.empreendimentos) {
  const d = e.dados
  const nome = (d.vem_nome ?? '').trim()
  const ficha = lerFicha(e.ficha_texto)
  const tipo = TIPO[d.tipo_nome]
  const preco = numero(d.vem_preco || 0)
  const fotos = [...new Set(e.fotos.map((f) => f.url))].slice(0, MAX_FOTOS)
  const motivo = !e.publicado || !d.vem_publicar ? 'não publicado'
    : !tipo ? `tipo "${d.tipo_nome}" sem página no site`
    : !preco ? 'sem preço'
    : !fotos.length ? 'sem fotos' : null
  if (motivo) { ignorados.push(`${d.vem_id} ${nome}: ${motivo}`); continue }

  const finalidade = d.vem_fl_finalidade === 2 ? 'aluguel' : 'venda'
  const area = faixa(ficha.area.length ? ficha.area : numeros(String(d.vem_area_privativa ?? '')).filter(Boolean)) ?? { min: 0, max: 0 }
  const entrega = ficha.entrega && ficha.entrega >= '2026-01' ? ficha.entrega : undefined
  catalogo.push(montar({
    id: d.vem_id, codigo: `VEM_${d.vem_id}`, nome, tipo, finalidade, situacao: SITUACAO[d.vem_situacao] ?? 'pronto',
    local: resolverLocal(d, ficha.local), preco, area,
    quartos: faixa(ficha.quartos) ?? { min: 0, max: 0 },
    banheiros: faixa(ficha.banheiros) ?? { min: 0, max: 0 },
    vagas: faixa(ficha.vagas.filter(Boolean)),
    entrega, mcmv: d.vem_mcmv === 1, cadastro: d.vem_data_cadastro, edicao: d.vem_data_edicao,
    descricao: htmlParaParagrafos(d.vem_descricao), fotos,
  }))
}

for (const i of bruto.imoveis) {
  const l = i.dados_lista
  const c = i.campos_edicao
  const fotos = [...new Set(i.fotos.map((f) => f.url))].slice(0, MAX_FOTOS)
  const tipo = TIPO[l.imp_nome]
  const preco = numero(l.imo_valor || 0)
  if (!tipo || !preco || !fotos.length) { ignorados.push(`IMO ${l.imo_id} ${l.imo_nome}: incompleto`); continue }
  const area = Number(String(c.imo_area_privativa || c.imo_area_construida || 0).replace(',', '.'))
  catalogo.push(montar({
    id: `i${l.imo_id}`, codigo: `IMO_${l.imo_id}`, nome: l.imo_nome, tipo,
    finalidade: /alugar/i.test(c.finalidade) ? 'aluguel' : 'venda',
    situacao: SITUACAO_TEXTO[norm(c.situacao ?? '')] ?? 'pronto',
    local: { bairro: l.brs_nome ? titulo(l.brs_nome) : 'Centro', cidade: titulo(l.bre_nome), uf: l.bro_sigla ?? 'PE', logradouro: l.imo_endereco || undefined },
    preco, area: { min: area, max: area },
    quartos: { min: l.imo_numero_quartos, max: l.imo_numero_quartos },
    banheiros: { min: l.imo_numero_banheiros, max: l.imo_numero_banheiros },
    vagas: l.imo_numero_garagens ? { min: l.imo_numero_garagens, max: l.imo_numero_garagens } : null,
    suites: l.imo_numero_suites || undefined,
    mcmv: false, cadastro: l.imo_data_cadastro, edicao: l.imo_data_edicao, descricao: htmlParaParagrafos(c.descricao), fotos,
  }))
}

// Slugs únicos: nomes repetidos no CRM ganham o id no final.
const vistos = new Map()
for (const im of catalogo) vistos.set(im.slug, (vistos.get(im.slug) ?? 0) + 1)
for (const im of catalogo) if (vistos.get(im.slug) > 1) im.slug = `${im.slug}-${im.id.replace(/\D/g, '')}`

// Destaques da home: os 6 de venda mais recentes com bastante foto; o herói é o primeiro lançamento deles.
const candidatos = catalogo
  .filter((im) => im.finalidade === 'venda' && im.fotos.length >= 5 && im.situacao !== 'pronto')
  .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
  .slice(0, 6)
candidatos.forEach((im) => { im.destaque = true })
const heroi = candidatos.find((im) => im.situacao === 'lancamento') ?? candidatos[0]
if (heroi) heroi.heroi = true

mkdirSync(dirname(saida), { recursive: true })
writeFileSync(saida, JSON.stringify(catalogo))
console.log(`${catalogo.length} imóveis gravados em ${saida}`)
console.log(`${ignorados.length} ignorados:\n  ${ignorados.join('\n  ')}`)
console.log(`cidades: ${[...new Set(catalogo.map((i) => i.local.cidade))].join(', ')}`)
console.log(`sem bairro confirmado: ${catalogo.filter((i) => i.local.bairro === 'A confirmar').length}; área zerada: ${catalogo.filter((i) => !i.area.max).length}`)
