// De onde vem o catálogo do site: do nosso banco (mantido pelo painel /admin) ou do CRM Viniun.
// Troca-se só pela variável FONTE_IMOVEIS (docs/integracao-viniun.md); sem ela, vale o banco.

export type FonteImoveis = 'banco' | 'viniun'

/** Tag do cache do catálogo: invalidá-la faz o site reler os imóveis (painel, /api/revalidar e webhook da Viniun). */
export const TAG_IMOVEIS = 'imoveis'

export function fonteDosImoveis(): FonteImoveis {
  const valor = (process.env.FONTE_IMOVEIS ?? '').trim().toLowerCase()
  if (valor === '' || valor === 'banco') return 'banco'
  if (valor === 'viniun') return 'viniun'
  throw new Error(`FONTE_IMOVEIS inválida: "${process.env.FONTE_IMOVEIS}". Use "banco" ou "viniun".`)
}

/** Se o painel cadastra e edita os imóveis (só quando o catálogo vem do banco). */
export const catalogoNoPainel = () => fonteDosImoveis() === 'banco'
