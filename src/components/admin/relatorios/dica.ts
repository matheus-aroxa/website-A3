// Dados da dica (tooltip) de uma marca de gráfico. Fica fora de Cartao.tsx (que é componente de cliente) para os gráficos,
// que são gerados no servidor, poderem chamar `dica()`.
export interface DadosDaDica {
  /** Cabeçalho da dica (ex.: a data). */
  t?: string
  /** Linhas: [nome, valor, cor da marca]. */
  l: [string, string, string?][]
}

/** Texto do atributo `data-dica` de uma marca. */
export const dica = (dados: DadosDaDica) => JSON.stringify(dados)
