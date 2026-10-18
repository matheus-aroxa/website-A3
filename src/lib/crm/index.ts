import 'server-only'
import { adaptadorMock } from './mock'
import type { AdaptadorCrm } from './tipos'

// Ponto único de troca do CRM. Quando a integração existir, por exemplo:
//   export const crm: AdaptadorCrm = process.env.CRM_PROVIDER === 'meucrm' ? adaptadorMeuCrm : adaptadorMock
export const crm: AdaptadorCrm = adaptadorMock

export type { AdaptadorCrm, Lead, OrigemLead } from './tipos'
