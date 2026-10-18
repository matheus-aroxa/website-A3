import type { Imovel } from '@/lib/imoveis/tipos'

export type OrigemLead = 'contato-home' | 'visita-imovel' | 'corretor-imovel'

export interface Lead {
  origem: OrigemLead
  nome: string
  whatsapp: string
  email?: string
  mensagem?: string
  interesse?: string
  canalPreferido?: 'whatsapp' | 'ligacao' | 'email'
  imovel?: { id: string; codigo: string; nome: string }
  visita?: { dias: string[]; horarios: string[] }
  consentimento: true
  criadoEm: string
}

/**
 * Contrato com o CRM. Para integrar um CRM real, crie um adaptador em `src/lib/crm/<nome>/`
 * que implemente esta interface e selecione-o em `src/lib/crm/index.ts`.
 */
export interface AdaptadorCrm {
  /** Catálogo publicado no site. O site aplica cache e filtros em cima disso. */
  listarImoveis(): Promise<Imovel[]>
  /** Registra um contato vindo dos formulários do site. */
  enviarLead(lead: Lead): Promise<{ protocolo: string }>
}
