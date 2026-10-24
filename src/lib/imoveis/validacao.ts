// Regras do formulário de imóvel (painel). Usadas no navegador, para avisar enquanto se preenche, e no
// servidor, que é quem decide: a ação refaz toda a conferência com o que chegou pela rede.
import { SITUACOES, TIPOS, lerNumeroBr } from './formato'

/** Texto de cada campo, como digitado (as faixas viram dois campos: `xxxMin` e `xxxMax`). */
export interface EntradaImovel {
  nome: string
  chamada: string
  tipo: string
  finalidade: string
  situacao: string
  preco: string
  areaMin: string
  areaMax: string
  quartosMin: string
  quartosMax: string
  suitesMin: string
  suitesMax: string
  banheirosMin: string
  banheirosMax: string
  vagasMin: string
  vagasMax: string
  entregaMes: string
  entregaAno: string
  bairro: string
  cidade: string
  uf: string
}

export type ErrosImovel = Partial<Record<keyof EntradaImovel | 'entrega', string>>

export const ESTADOS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'],
] as const

export const UFS: string[] = ESTADOS.map(([sigla]) => sigla)

export const LIMITES = {
  nome: [3, 120],
  chamada: [5, 200],
  local: [2, 80],
  precoVenda: 100_000_000,
  precoAluguel: 1_000_000,
  area: 100_000,
  comodos: 30,
  vagas: 30,
} as const

const real = (n: number) => n.toLocaleString('pt-BR')

/** `undefined`: vazio. Senão o número, ou o texto de erro. */
function lerNumero(texto: string): { vazio: true } | { n: number } | { erro: string } {
  const n = lerNumeroBr(texto)
  if (n === undefined) return { vazio: true }
  return Number.isNaN(n) ? { erro: 'Use apenas números.' } : { n }
}

export function validarImovel(e: EntradaImovel): ErrosImovel {
  const erros: ErrosImovel = {}

  const nome = e.nome.trim()
  if (nome.length < LIMITES.nome[0]) erros.nome = 'Informe o nome do imóvel.'
  else if (nome.length > LIMITES.nome[1]) erros.nome = `Use no máximo ${LIMITES.nome[1]} caracteres.`

  const chamada = e.chamada.trim()
  if (chamada.length < LIMITES.chamada[0]) erros.chamada = 'Escreva uma frase curta sobre o imóvel.'
  else if (chamada.length > LIMITES.chamada[1]) erros.chamada = `Use no máximo ${LIMITES.chamada[1]} caracteres.`

  if (!TIPOS.some((t) => t === e.tipo)) erros.tipo = 'Escolha o tipo.'
  if (e.finalidade !== 'venda' && e.finalidade !== 'aluguel') erros.finalidade = 'Escolha a finalidade.'
  if (!SITUACOES.some((s) => s === e.situacao)) erros.situacao = 'Escolha a situação da obra.'

  // Valor
  const preco = lerNumero(e.preco)
  const tetoPreco = e.finalidade === 'aluguel' ? LIMITES.precoAluguel : LIMITES.precoVenda
  if ('erro' in preco) erros.preco = preco.erro
  else if ('vazio' in preco || preco.n <= 0) erros.preco = 'Informe um valor maior que zero.'
  else if (preco.n > tetoPreco) erros.preco = `Confira o valor: o máximo aceito é R$ ${real(tetoPreco)}.`

  // Faixas (mínimo e máximo em campos separados). `obrigatoria`: o mínimo precisa existir.
  function faixa(
    campo: 'area' | 'quartos' | 'banheiros' | 'vagas' | 'suites',
    { obrigatoria, inteiro, minimo, maximo, zeroRepete }: { obrigatoria: boolean; inteiro: boolean; minimo: number; maximo: number; zeroRepete?: boolean },
  ) {
    const min = lerNumero(e[`${campo}Min`])
    let max = lerNumero(e[`${campo}Max`])
    // Área: máximo 0 (ou vazio) quer dizer "mesmo tamanho do mínimo".
    if (zeroRepete && 'n' in max && max.n === 0) max = { vazio: true }
    const chaveMin = `${campo}Min` as const
    const chaveMax = `${campo}Max` as const

    const conferir = (v: ReturnType<typeof lerNumero>, chave: typeof chaveMin | typeof chaveMax) => {
      if ('erro' in v) erros[chave] = v.erro
      else if ('n' in v) {
        if (inteiro && !Number.isInteger(v.n)) erros[chave] = 'Use um número inteiro.'
        else if (v.n < minimo) erros[chave] = minimo > 0 ? `O mínimo é ${real(minimo)}.` : 'Não pode ser negativo.'
        else if (v.n > maximo) erros[chave] = `O máximo aceito é ${real(maximo)}.`
      }
    }
    conferir(min, chaveMin)
    conferir(max, chaveMax)

    if ('vazio' in min && !erros[chaveMin]) {
      if (obrigatoria) erros[chaveMin] = 'Informe o valor mínimo.'
      else if ('n' in max) erros[chaveMin] = 'Informe o mínimo.'
    }
    if ('n' in min && 'n' in max && !erros[chaveMin] && !erros[chaveMax] && max.n < min.n) {
      erros[chaveMax] = 'O máximo não pode ser menor que o mínimo.'
    }
  }
  faixa('area', { obrigatoria: true, inteiro: false, minimo: 1, maximo: LIMITES.area, zeroRepete: true })
  faixa('quartos', { obrigatoria: true, inteiro: true, minimo: 0, maximo: LIMITES.comodos })
  faixa('banheiros', { obrigatoria: true, inteiro: true, minimo: 0, maximo: LIMITES.comodos })
  faixa('vagas', { obrigatoria: false, inteiro: true, minimo: 0, maximo: LIMITES.vagas })

  // Suítes: faixa opcional (como as vagas) que não passa do número máximo de quartos.
  faixa('suites', { obrigatoria: false, inteiro: true, minimo: 0, maximo: LIMITES.comodos })
  const suitesMax = lerNumero(e.suitesMax.trim() ? e.suitesMax : e.suitesMin)
  const quartosMax = lerNumero(e.quartosMax.trim() ? e.quartosMax : e.quartosMin)
  if (!erros.suitesMin && !erros.suitesMax && 'n' in suitesMax && 'n' in quartosMax && suitesMax.n > quartosMax.n) {
    erros.suitesMax = 'Não pode passar do número de quartos.'
  }

  // Entrega: mês e ano juntos, ou nenhum dos dois.
  if (e.entregaMes && !e.entregaAno) erros.entrega = 'Escolha também o ano.'
  else if (!e.entregaMes && e.entregaAno) erros.entrega = 'Escolha também o mês.'
  else if (e.entregaMes && e.entregaAno && !/^\d{4}-(0[1-9]|1[0-2])$/.test(`${e.entregaAno}-${e.entregaMes}`)) {
    erros.entrega = 'Escolha o mês e o ano.'
  }

  // Local
  for (const campo of ['bairro', 'cidade'] as const) {
    const t = e[campo].trim()
    if (t.length < LIMITES.local[0]) erros[campo] = campo === 'bairro' ? 'Escolha ou informe o bairro.' : 'Escolha a cidade.'
    else if (t.length > LIMITES.local[1]) erros[campo] = `Use no máximo ${LIMITES.local[1]} caracteres.`
  }
  if (!UFS.includes(e.uf.trim().toUpperCase())) erros.uf = 'Escolha o estado.'

  return erros
}
