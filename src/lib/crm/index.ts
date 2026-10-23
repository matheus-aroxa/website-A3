import 'server-only'
import { adaptadorSupremo } from './supremo'
import type { AdaptadorCrm } from './tipos'

// Ponto único de troca do CRM. Quando a integração existir, por exemplo:
//   export const crm: AdaptadorCrm = process.env.CRM_PROVIDER === 'meucrm' ? adaptadorMeuCrm : adaptadorSupremo
export const crm: AdaptadorCrm = adaptadorSupremo

export type { AdaptadorCrm, Lead, OrigemLead } from './tipos'
