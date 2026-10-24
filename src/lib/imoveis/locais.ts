// Estados, cidades e bairros que o formulário de imóvel oferece. As cidades vêm da lista de municípios do IBGE
// (municipios.json) somada às do catálogo; os bairros, dos já cadastrados em cada cidade (o IBGE não tem bairros).
import 'server-only'
import { banco } from '@/lib/db'
import { ESTADOS } from './validacao'
import { normalizarBusca } from './formato'
import municipios from './municipios.json'

export interface LocaisDoEstado {
  cidades: string[]
  /** Bairros já cadastrados, por nome de cidade. */
  bairros: Record<string, string[]>
}

const porNome = (a: string, b: string) => a.localeCompare(b, 'pt-BR')

export async function locaisDoEstado(uf: string): Promise<LocaisDoEstado> {
  const doIbge = (municipios as Record<string, string[]>)[uf] ?? []
  const { rows } = await banco().query<{ cidade: string; bairro: string | null }>(
    `SELECT c.nome AS cidade, b.nome AS bairro
       FROM cidades c LEFT JOIN bairros b ON b.cidade_id = c.id
      WHERE c.uf = $1
      ORDER BY c.nome, b.nome`,
    [uf],
  )
  // O catálogo importado tem uma "cidade" chamada Pernambuco: não é cidade, então não vai para a lista.
  const nomesDeEstado = new Set(ESTADOS.map(([, nome]) => normalizarBusca(nome)))
  const bairros: Record<string, string[]> = {}
  const cidades = new Map(doIbge.map((nome) => [normalizarBusca(nome), nome]))
  for (const { cidade, bairro } of rows) {
    if (nomesDeEstado.has(normalizarBusca(cidade))) continue
    const chave = normalizarBusca(cidade)
    // Mesmo nome com grafia do IBGE: vale a do IBGE.
    const nome = cidades.get(chave) ?? cidade
    cidades.set(chave, nome)
    if (bairro) (bairros[nome] ??= []).push(bairro)
  }
  for (const lista of Object.values(bairros)) lista.sort(porNome)
  return { cidades: [...cidades.values()].sort(porNome), bairros }
}

export async function cidadeDoEstado(uf: string, cidade: string) {
  const { cidades } = await locaisDoEstado(uf)
  const chave = normalizarBusca(cidade)
  return cidades.find((c) => normalizarBusca(c) === chave)
}
