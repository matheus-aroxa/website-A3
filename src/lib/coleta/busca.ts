// Resumo de uma busca para a medição de uso: a lista dos filtros ativos como "filtro:valor" (ex.: "quartos:2", "cidade:paulista").
// Só entram valores que o site oferece (cidade, tipo, quartos...). O texto livre digitado vai à parte, em `q`.
import type { Filtros } from '@/lib/imoveis/filtros'

export function filtrosAtivos(f: Filtros): string[] {
  const itens: string[] = []
  if (f.categoria !== 'todos') itens.push(`categoria:${f.categoria}`)
  f.situacoes.forEach((s) => itens.push(`situacao:${s}`))
  f.tipos.forEach((t) => itens.push(`tipo:${t}`))
  if (f.cidade) itens.push(`cidade:${f.cidade}`)
  if (f.bairro) itens.push(`bairro:${f.bairro}`)
  f.construtoras.forEach((c) => itens.push(`construtora:${c}`))
  if (f.quartos) itens.push(`quartos:${f.quartos}`)
  if (f.banheiros) itens.push(`banheiros:${f.banheiros}`)
  if (f.vagas) itens.push(`vagas:${f.vagas}`)
  if (f.mcmv) itens.push('mcmv:sim')
  if (f.areaMin || f.areaMax) itens.push('area:informada')
  if (f.entrega) itens.push(`entrega:${f.entrega}`)
  if (f.ordem !== 'recentes') itens.push(`ordem:${f.ordem}`)
  return itens.slice(0, 24)
}
