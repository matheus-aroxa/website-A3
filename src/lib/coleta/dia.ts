// O "dia" dos relatórios é o de Recife (o horário da A3), não o do servidor.
export const FUSO = 'America/Recife'

const formato = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Hoje em Recife, como AAAA-MM-DD. */
export const hojeEmRecife = () => formato.format(new Date())
