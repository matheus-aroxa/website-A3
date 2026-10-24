// Tipos e validações compartilhados pelos formulários de contato.

export interface EstadoFormulario {
  status: 'inicial' | 'sucesso' | 'erro'
  mensagem?: string
  /** Para onde levar a pessoa depois de um sucesso (o formulário navega; a ação não redireciona). */
  destino?: string
  erros?: Partial<Record<string, string>>
  /** Valores enviados, devolvidos em caso de erro para não apagar o que a pessoa digitou. */
  valores?: Record<string, string>
  /** Link do WhatsApp com a mensagem pronta, quando o formulário termina abrindo uma conversa. */
  whatsapp?: string
}

export const ESTADO_INICIAL: EstadoFormulario = { status: 'inicial' }

/** Nome do campo-armadilha para robôs (fica invisível para pessoas). */
export const CAMPO_ARMADILHA = 'site_empresa'

export function texto(fd: FormData, campo: string, limite = 500) {
  const v = fd.get(campo)
  return typeof v === 'string' ? v.trim().slice(0, limite) : ''
}

export function validarNome(nome: string) {
  return nome.length >= 2 ? undefined : 'Informe seu nome.'
}

export function apenasDigitos(v: string) {
  return v.replace(/\D/g, '')
}

export function validarWhatsapp(numero: string) {
  const digitos = apenasDigitos(numero)
  return digitos.length >= 10 && digitos.length <= 13 ? undefined : 'Informe um WhatsApp com DDD.'
}

export function validarEmail(email: string, obrigatorio = false) {
  if (!email) return obrigatorio ? 'Informe seu e-mail.' : undefined
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? undefined : 'Confira o e-mail informado.'
}

export function validarConsentimento(fd: FormData) {
  return fd.get('consentimento') === 'on' ? undefined : 'É preciso autorizar o contato para continuar.'
}

/** Máscara leve para telefone brasileiro: (81) 9 9148-3731. */
export function mascararTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`
}
