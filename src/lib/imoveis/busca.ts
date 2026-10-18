import { normalizarBusca } from './formato'
import type { Filtros } from './filtros'
import type { Cidade, Imovel, ImovelResumo } from './tipos'

const FIM_DO_ANO: Record<string, string> = { '2026': '2026-12', '2027': '2027-12', '2028': '2028-12' }

export function atendeFiltros(im: Imovel, f: Filtros) {
  if (f.categoria !== 'todos' && im.finalidade !== f.categoria) return false
  if (f.situacoes.length && !f.situacoes.includes(im.situacao)) return false
  if (f.tipos.length && !f.tipos.includes(im.tipo)) return false
  if (f.cidade && im.local.cidadeSlug !== f.cidade) return false
  if (f.bairro && im.local.bairroSlug !== f.bairro) return false
  if (im.quartos.max < f.quartos) return false
  if (im.banheiros.max < f.banheiros) return false
  if ((im.vagas?.max ?? 0) < f.vagas) return false
  if (f.mcmv && !im.mcmv) return false
  if (f.areaMin && im.area.max < f.areaMin) return false
  if (f.areaMax && im.area.min > f.areaMax) return false
  if (f.entrega) {
    if (f.entrega === 'pronto') {
      if (im.situacao !== 'pronto') return false
    } else if (im.situacao !== 'pronto' && (!im.entrega || im.entrega > FIM_DO_ANO[f.entrega]!)) {
      return false
    }
  }
  if (f.q.trim()) {
    const alvo = normalizarBusca(`${im.nome} ${im.local.bairro} ${im.local.cidade} ${im.codigo}`)
    if (!normalizarBusca(f.q).split(/\s+/).every((termo) => alvo.includes(termo))) return false
  }
  return true
}

export function ordenar(lista: Imovel[], ordem: Filtros['ordem']) {
  const copia = [...lista]
  switch (ordem) {
    case 'menor-preco':
      return copia.sort((a, b) => a.preco - b.preco)
    case 'maior-preco':
      return copia.sort((a, b) => b.preco - a.preco)
    case 'maior-area':
      return copia.sort((a, b) => b.area.max - a.area.max)
    case 'mais-quartos':
      return copia.sort((a, b) => b.quartos.max - a.quartos.max)
    default:
      return copia.sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))
  }
}

export function resumir(im: Imovel): ImovelResumo {
  return {
    id: im.id,
    codigo: im.codigo,
    slug: im.slug,
    nome: im.nome,
    tipo: im.tipo,
    finalidade: im.finalidade,
    situacao: im.situacao,
    local: { bairro: im.local.bairro, cidade: im.local.cidade },
    preco: im.preco,
    area: im.area,
    quartos: im.quartos,
    banheiros: im.banheiros,
    vagas: im.vagas,
    entrega: im.entrega,
    capa: im.capa ?? im.fotos[0]!,
  }
}

/** Cidades e bairros presentes no catálogo, em ordem alfabética. */
export function extrairCidades(imoveis: Imovel[]): Cidade[] {
  const mapa = new Map<string, Cidade>()
  for (const { local } of imoveis) {
    const cidade = mapa.get(local.cidadeSlug) ?? { nome: local.cidade, slug: local.cidadeSlug, bairros: [] }
    if (!cidade.bairros.some((b) => b.slug === local.bairroSlug))
      cidade.bairros.push({ nome: local.bairro, slug: local.bairroSlug })
    mapa.set(local.cidadeSlug, cidade)
  }
  const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, 'pt-BR')
  return [...mapa.values()].map((c) => ({ ...c, bairros: c.bairros.sort(porNome) })).sort(porNome)
}
