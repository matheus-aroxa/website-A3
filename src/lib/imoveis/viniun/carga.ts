// Leitura do catálogo inteiro da Viniun, sem o cache do Next (que fica em viniun/consultas.ts).
// A busca da Viniun não tem todos os filtros e a ordenação do site, e a listagem não traz a situação da obra: por isso o
// site usa a ficha completa de cada imóvel e filtra em memória (filtragem.ts). As fichas têm uma cópia no banco
// (fichas.ts, tabela viniun_fichas): a cada atualização, só as novas ou alteradas são baixadas.
import 'server-only'
import { agruparCidades } from '../filtragem'
import type { Imovel } from '../tipos'
import { lerFichas, lerLocais } from './fichas'
import { localDoSite, paraImovel, tipoDoSite } from './mapeamento'
import { lerReferencias } from './referencias'

async function montarCatalogo(): Promise<Imovel[]> {
  const hoje = new Date().toISOString().slice(0, 10)
  const [fichas, refs] = await Promise.all([lerFichas(), lerReferencias()])
  const imoveis: Imovel[] = []
  const slugs = new Set<string>()
  for (const { ficha, mcmv } of fichas) {
    const imovel = paraImovel(ficha, mcmv, refs, hoje)
    if (!imovel) {
      console.warn(`[viniun] ${ficha.codigo ?? ficha.id} fora do site: tipo "${ficha.tipo?.slug}" ou sem cidade`)
      continue
    }
    // O mesmo código duas vezes na Viniun daria dois anúncios no mesmo endereço: vale o primeiro.
    if (slugs.has(imovel.slug)) {
      console.warn(`[viniun] ${imovel.codigo} repetido na Viniun: só um aparece no site`)
      continue
    }
    slugs.add(imovel.slug)
    imoveis.push(imovel)
  }
  return imoveis
}

// Várias páginas pedem o catálogo ao mesmo tempo quando o cache está vazio (no build, por exemplo):
// uma carga só por processo, que todas aguardam.
let emAndamento: Promise<Imovel[]> | null = null

export function baixarCatalogo(): Promise<Imovel[]> {
  emAndamento ??= montarCatalogo().finally(() => {
    emAndamento = null
  })
  return emAndamento
}

/** Só as cidades e bairros (para o proxy validar as URLs de busca), sem abrir as fichas. */
export async function baixarCidades() {
  const [locais, refs] = await Promise.all([lerLocais(), lerReferencias()])
  return agruparCidades(
    locais.flatMap((l) => {
      const local = tipoDoSite(l.tipo_slug) ? localDoSite(l, refs) : null
      return local ? [{ local }] : []
    }),
  )
}
