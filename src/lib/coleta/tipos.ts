// Vocabulário da medição de uso, compartilhado pelo navegador (quem envia) e pelo servidor (quem confere e grava).
// Não importa nada de servidor. O que é gravado e como: db/relatorios.sql e docs/relatorios.md.

export const TIPOS_EVENTO = [
  'visita',
  'whatsapp',
  'ligacao',
  'email',
  'formulario-iniciado',
  'formulario-enviado',
  'formulario-erro',
  'galeria',
  'planta',
  'mapa',
  'compartilhar',
  'card',
  'busca',
  'externo',
  'nao-encontrada',
  'acao',
] as const

export type TipoEvento = (typeof TIPOS_EVENTO)[number]

/** O que conta como conversão: a pessoa escolheu falar com a A3. Clique no telefone ou no e-mail não conta. Só a intenção é visível, não a mensagem enviada. */
export const TIPOS_CONVERSAO: TipoEvento[] = ['whatsapp', 'formulario-enviado']

/** Eventos que mostram interesse no imóvel sem ser contato (fotos, planta, mapa, compartilhar ou começar a preencher um formulário). */
export const TIPOS_INTERACAO: TipoEvento[] = ['galeria', 'planta', 'mapa', 'compartilhar', 'formulario-iniciado']

export type Detalhe = Record<string, string | number | string[]>

/** Evento enviado pelo navegador. Os nomes são curtos porque vão em cada requisição. */
export interface CargaEvento {
  t: TipoEvento
  /** Caminho da página (sem endereço do site nem query). */
  c: string
  /** Rótulo: de onde veio o clique, qual formulário, qual mensagem de erro... */
  r?: string
  v?: number
  /** Slug do imóvel clicado (quando não é o da própria página). */
  i?: string
  d?: Detalhe
  /** Identificador da visualização de página (só em `visita`). */
  pv?: string
  /** Só na primeira página do documento: de onde a pessoa veio e com que parâmetros. */
  ref?: string
  q?: string
  /** Largura da janela, para saber se é celular, tablet ou computador. */
  w?: number
  l?: string
}

/** Enviado quando a pessoa sai da página: completa a visita com o tempo e a rolagem. */
export interface CargaSaida {
  t: 'saida'
  pv: string
  /** Segundos com a aba visível. */
  s: number
  /** Até onde a página foi rolada, de 0 a 100. */
  p: number
}

export type Carga = CargaEvento | CargaSaida

/** Cookie que marca o navegador da equipe: quem entrou no painel não entra nos números. */
export const COOKIE_EQUIPE = 'a3_equipe'

/** Quanto tempo os eventos brutos ficam no banco (o resumo diário fica para sempre). */
export const RETENCAO_DIAS = 90

/** Minutos sem eventos para uma sessão acabar. */
export const SESSAO_MINUTOS = 30
