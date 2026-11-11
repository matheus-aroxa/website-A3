// Tradução da ficha da Viniun para o modelo do site (tipos.ts): primeiro o resumo (o que a busca e os cards usam),
// depois o resto da ficha (descrição, galeria, características, mapa). O que a Viniun não tem fica no valor neutro:
// ver docs/integracao-viniun.md.
import { altDaFoto, formatarQuartos, nomeDoLocal, rotuloTipo, slugificar } from '../formato'
import { SLUG_BAIRRO_PROVISORIO } from '../paginas'
import {
  SLUG_CONSTRUTORA_PADRAO,
  type Construtora,
  type Faixa,
  type Finalidade,
  type Foto,
  type Imovel,
  type Localizacao,
  type Situacao,
  type TipoImovel,
} from '../tipos'
import type { FotoViniun, ImovelViniun } from './api'
import { chaveBairro, chaveCidade, type Referencias } from './referencias'

/** Prefixo do id dos imóveis que só existem na Viniun (os que vieram do banco mantêm o id de lá). */
export const PREFIXO_ID_VINIUN = 'viniun-'

// O site só tem três tipos. Os comerciais (loja, sala, galpão…) ficam fora do site.
const TIPOS: Record<string, TipoImovel> = {
  apartamento: 'apartamento',
  cobertura: 'apartamento',
  flat: 'apartamento',
  kitnet: 'apartamento',
  studio: 'apartamento',
  casa: 'casa-condominio',
  'casa-de-condominio': 'casa-condominio',
  sobrado: 'casa-condominio',
  bangalo: 'casa-condominio',
  'sobreposta-alta': 'casa-condominio',
  'sobreposta-baixa': 'casa-condominio',
  terreno: 'terreno',
  chacara: 'terreno',
  sitio: 'terreno',
  fazenda: 'terreno',
}

export const tipoDoSite = (slugViniun: string | null | undefined): TipoImovel | null =>
  slugViniun ? (TIPOS[slugViniun] ?? null) : null

const finalidadeDoSite = (slug: string | null | undefined): Finalidade =>
  slug && /loca|alug|temporada/.test(slug) ? 'aluguel' : 'venda'

/**
 * Situação da obra pelo campo "Situação" da Viniun: "Na planta" (ou a marcação de lançamento) = lançamento, "Em construção"
 * = em construção, as demais (Pronto para morar, Novo, Usado…) = pronto. A Viniun não tem "breve lançamento": esses entram
 * como lançamento. Sem situação preenchida, vale a data de entrega: no futuro = em construção.
 */
function situacaoDoSite(texto: string | null, lancamento: boolean, entrega: string | undefined, finalidade: Finalidade, hoje: string): Situacao {
  if (finalidade === 'aluguel') return 'pronto'
  const t = (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (lancamento || t.includes('planta') || t.includes('lancamento')) return 'lancamento'
  if (t.includes('constru') || t.includes('obra')) return 'em-construcao'
  if (t) return 'pronto'
  if (entrega && entrega > hoje.slice(0, 7)) return 'em-construcao'
  return 'pronto'
}

/**
 * O título da Viniun costuma vir com o tipo e o lugar ("Di Cavalcanti Residence – Apartamento à venda em Porto de Galinhas,
 * Ipojuca"). O site monta essa parte sozinho (título da página, chamada), então fica só o nome do empreendimento.
 */
export function nomeDoTitulo(titulo: string) {
  const nome = titulo.replace(/\s+[–—-]\s+[^–—]*\b(à venda|a venda|para alugar|para loca[çc][ãa]o)\b.*$/i, '').trim()
  return nome || titulo.trim()
}

/** Cidade e bairro com os mesmos slugs que o banco usava (as URLs de busca não mudam); `null` sem cidade. */
export function localDoSite(
  { cidade, uf, bairro }: { cidade: string | null; uf: string | null; bairro: string | null },
  refs: Pick<Referencias, 'cidades' | 'bairros'>,
): Pick<Localizacao, 'cidade' | 'cidadeSlug' | 'uf' | 'bairro' | 'bairroSlug'> | null {
  if (!cidade?.trim()) return null
  const ufFinal = (uf ?? 'PE').toUpperCase()
  const cidadeSlug = refs.cidades.get(chaveCidade(cidade, ufFinal)) ?? slugificar(cidade)
  const nomeBairro = bairro?.trim() ? nomeDoLocal(bairro.trim()) : 'A confirmar'
  const bairroSlug = bairro?.trim()
    ? (refs.bairros.get(chaveBairro(cidadeSlug, bairro)) ?? slugificar(bairro))
    : SLUG_BAIRRO_PROVISORIO
  return { cidade: cidade.trim(), cidadeSlug, uf: ufFinal, bairro: nomeBairro, bairroSlug }
}

// Fotos da Viniun: thumb (~300 px), media (~800 px) e grande (~1600 px). O site guarda a grande; o carregador de
// imagem (carregador-imagem.ts) troca pela menor que cobre o tamanho pedido.
const LARGURA_GRANDE = 1600

function paraFoto(f: Pick<FotoViniun, 'grande' | 'media' | 'thumb'> & Partial<FotoViniun>, alt: string): Foto | null {
  const src = f.grande ?? f.media ?? f.original ?? f.thumb
  if (!src) return null
  // Sem as dimensões (fotos antigas), supõe 4:3. Os cards e a galeria recortam a foto, então só a proporção importa.
  const largura = f.largura && f.altura ? Math.min(LARGURA_GRANDE, f.largura) : LARGURA_GRANDE
  const altura = f.largura && f.altura ? Math.round((f.altura * largura) / f.largura) : 1200
  return { src, width: largura, height: altura, alt, ...(f.legenda ? { legenda: f.legenda } : {}) }
}

/** Construtora padrão ("Não informado"), para imóvel sem construtora na Viniun. */
export const CONSTRUTORA_PADRAO: Construtora = { id: 0, nome: 'Não informado', slug: SLUG_CONSTRUTORA_PADRAO }

/** Id numérico estável para a construtora (o site só usa o slug; o id existe porque o tipo pede). */
export function idDaConstrutora(slug: string) {
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h) || 1
}

const faixa = (n: number): Faixa => ({ min: n, max: n })
const data = (iso: string | null | undefined) => iso?.slice(0, 10) || null

/** Os campos da ficha que o resumo (busca e cards) usa. */
export interface BaseViniun {
  id: number
  codigo: string | null
  slug: string
  titulo: string
  tipoSlug: string | null
  finalidadeSlug: string | null
  cidade: string | null
  uf: string | null
  bairro: string | null
  dormitorios: number | null
  suites: number | null
  banheiros: number | null
  vagas: number | null
  area: number | null
  valor: number | null
  capa: (Pick<FotoViniun, 'grande' | 'media' | 'thumb'> & Partial<FotoViniun>) | null
  destaque: boolean
  lancamento: boolean
  /** Texto do campo "Situação". */
  situacao: string | null
  dataEntrega: string | null
  atualizadoEm: string | null
}

export function baseDaFicha(f: ImovelViniun): BaseViniun {
  const finalidade = finalidadeDoSite(f.finalidade?.slug)
  const capa = f.fotos.find((x) => x.capa && x.tipo !== 'planta') ?? f.fotos.find((x) => x.tipo !== 'planta') ?? null
  return {
    id: f.id,
    codigo: f.codigo,
    slug: f.slug,
    titulo: f.titulo,
    tipoSlug: f.tipo?.slug ?? null,
    finalidadeSlug: f.finalidade?.slug ?? null,
    cidade: f.localizacao.cidade,
    uf: f.localizacao.uf,
    bairro: f.localizacao.bairro,
    dormitorios: f.dormitorios,
    suites: f.suites,
    banheiros: f.banheiros,
    vagas: f.vagas,
    // O site mostra "Área privativa" (é o que o banco guardava); sem ela, a útil ou a total.
    area: f.areas.privativa ?? f.areas.util ?? f.areas.total,
    valor: finalidade === 'aluguel' ? f.valores.locacao : f.valores.venda,
    capa,
    destaque: f.destaque,
    lancamento: f.lancamento,
    situacao: f.situacao,
    dataEntrega: f.data_entrega,
    atualizadoEm: f.atualizado_em,
  }
}

/** O que a busca e os cards usam (sem descrição nem galeria). `null` quando não cabe no site (tipo comercial ou sem cidade). */
export function paraResumo(
  b: BaseViniun,
  extras: { mcmv: boolean; construtora: Construtora | undefined; hoje: string },
  refs: Referencias,
): Imovel | null {
  const tipo = tipoDoSite(b.tipoSlug)
  const lugar = localDoSite(b, refs)
  if (!tipo || !lugar) return null

  const codigo = b.codigo?.trim() || String(b.id)
  const doBanco = refs.porCodigo.get(codigo.toUpperCase())
  const finalidade = finalidadeDoSite(b.finalidadeSlug)
  const nome = nomeDoTitulo(b.titulo)
  const quartos = faixa(b.dormitorios ?? 0)
  const entrega = b.dataEntrega?.slice(0, 7) || undefined
  const capa = b.capa ? (paraFoto(b.capa, altDaFoto({ nome, tipo, bairro: lugar.bairro, cidade: lugar.cidade }, 0)) ?? undefined) : undefined
  const atualizadoEm = data(b.atualizadoEm) ?? extras.hoje

  return {
    id: doBanco?.id ?? `${PREFIXO_ID_VINIUN}${b.id}`,
    codigo,
    slug: doBanco?.slug ?? b.slug,
    nome,
    tipo,
    finalidade,
    situacao: situacaoDoSite(b.situacao, b.lancamento, entrega, finalidade, extras.hoje),
    local: lugar,
    preco: b.valor ?? 0,
    area: faixa(b.area ?? 0),
    quartos,
    suites: b.suites === null ? undefined : faixa(b.suites),
    banheiros: faixa(b.banheiros ?? 0),
    vagas: b.vagas === null ? null : faixa(b.vagas),
    entrega,
    mcmv: extras.mcmv,
    destaque: b.destaque,
    heroi: false,
    publicadoEm: atualizadoEm,
    atualizadoEm,
    chamada: `${rotuloTipo[tipo]}${tipo !== 'terreno' && quartos.max > 0 ? ` de ${formatarQuartos(quartos)}` : ''} em ${lugar.bairro}, ${lugar.cidade} – ${lugar.uf}`,
    descricao: [],
    fotos: capa ? [capa] : [],
    capa,
    plantas: [],
    lazer: [],
    proximidades: [],
    construtora: extras.construtora ?? CONSTRUTORA_PADRAO,
  }
}

/** O resumo + o conteúdo da ficha (descrição, galeria, plantas, características, endereço e mapa). */
export function completar(resumo: Imovel, f: ImovelViniun): Imovel {
  const paraAlt = { nome: resumo.nome, tipo: resumo.tipo, bairro: resumo.local.bairro, cidade: resumo.local.cidade }
  const galeria = f.fotos.filter((x) => x.tipo !== 'planta')
  const fotos = galeria.flatMap((x, i) => paraFoto(x, altDaFoto(paraAlt, i)) ?? [])
  const iCapa = galeria.findIndex((x) => x.capa)
  const capa = iCapa >= 0 ? (paraFoto(galeria[iCapa]!, altDaFoto(paraAlt, iCapa)) ?? undefined) : undefined
  const plantas = f.fotos
    .filter((x) => x.tipo === 'planta')
    .flatMap((x, i) => {
      const foto = paraFoto(x, `Planta ${i + 1} – ${resumo.nome}`)
      return foto ? [{ titulo: x.legenda || `Planta ${i + 1}`, descricao: formatarQuartos(resumo.quartos), area: resumo.area.max, foto }] : []
    })
  const { coordenadas, endereco_completo, logradouro, numero } = f.localizacao

  return {
    ...resumo,
    local: {
      ...resumo.local,
      ...(endereco_completo && logradouro ? { logradouro: numero ? `${logradouro}, ${numero}` : logradouro } : {}),
      // Coordenada aproximada é só a região (a Viniun esconde o ponto exato): o site não marca um ponto falso no mapa.
      ...(coordenadas && !coordenadas.aproximado ? { geo: { lat: coordenadas.lat, lng: coordenadas.lng } } : {}),
    },
    publicadoEm: data(f.publicado_em) ?? resumo.publicadoEm,
    descricao: (f.descricao ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean),
    fotos: fotos.length ? fotos : resumo.fotos,
    capa: capa ?? resumo.capa,
    plantas,
    lazer: f.caracteristicas ?? [],
    proximidades: f.proximidades ?? [],
  }
}

/** A construtora informada na ficha (ou a padrão, "Não informado"). */
export function construtoraDaFicha(f: ImovelViniun): Construtora {
  const nome = f.construtora?.nome?.trim()
  if (!nome) return CONSTRUTORA_PADRAO
  // O slug da Viniun leva um sufixo aleatório com maiúsculas ("mrv-HGzFG"), que o filtro da busca não aceita. O slug do
  // site sai do nome, como no banco ("mrv", "moura-dubeux"): o link do filtro é o mesmo nos dois modos.
  const slug = slugificar(nome)
  return { id: idDaConstrutora(slug), nome, slug }
}

/** O imóvel completo, a partir da ficha. `null` quando não cabe no site (tipo comercial ou sem cidade). */
export function paraImovel(f: ImovelViniun, mcmv: boolean, refs: Referencias, hoje: string): Imovel | null {
  const resumo = paraResumo(baseDaFicha(f), { mcmv, construtora: construtoraDaFicha(f), hoje }, refs)
  return resumo && completar(resumo, f)
}
