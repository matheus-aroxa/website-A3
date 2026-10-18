import type { AdaptadorCrm } from '../tipos'
import { imoveisMock } from './imoveis'

export const adaptadorMock: AdaptadorCrm = {
  async listarImoveis() {
    return imoveisMock
  },
  async enviarLead(lead) {
    const protocolo = `A3-${Date.now().toString(36).toUpperCase()}`
    // Sem CRM ainda: registra no log do servidor para conferência.
    console.info('[crm:mock] lead recebido', protocolo, JSON.stringify(lead))
    return { protocolo }
  },
}
