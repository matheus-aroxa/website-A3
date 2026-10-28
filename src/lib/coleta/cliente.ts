// Lado do navegador da medição de uso. O que é enviado e o que o servidor faz com isso: docs/relatorios.md.
// Nada é guardado no aparelho (sem cookie, localStorage ou sessionStorage): o identificador da visita só existe na memória da página.
import type { Carga, CargaEvento, CargaSaida, TipoEvento } from './tipos'

let ativa = false
let fila: Promise<unknown> = Promise.resolve()

export const ativarColeta = (valor: boolean) => {
  ativa = valor
}

function enviar(carga: Carga, aoSair = false) {
  if (!ativa) return
  const corpo = JSON.stringify(carga)
  // Ao sair da página só o sendBeacon é garantido. No resto, os envios seguem em fila: a visita sempre chega antes dos eventos dela.
  if (aoSair && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/coleta', new Blob([corpo], { type: 'application/json' }))
    return
  }
  fila = fila
    .then(() => fetch('/api/coleta', { method: 'POST', body: corpo, headers: { 'content-type': 'application/json' }, keepalive: true }))
    .catch(() => undefined)
}

export function registrar(tipo: TipoEvento, extras: Pick<CargaEvento, 'r' | 'v' | 'i' | 'd'> = {}) {
  enviar({ t: tipo, c: location.pathname, ...extras })
}

// ---------- Visita ----------

type Vitais = NonNullable<CargaSaida['w']>

const visita = {
  pv: null as string | null,
  caminho: '',
  /** Quando a visita atual começou (ms). */
  inicio: 0,
  /** A primeira página do documento é a que recebe a velocidade de carregamento (LCP, CLS...), que é do documento todo. */
  primeiroPv: null as string | null,
  /** Tempo com a aba visível já somado, em ms. */
  tempo: 0,
  /** Quando o trecho visível em andamento começou (0 se a aba está escondida). */
  visivelDesde: 0,
  rolagem: 0,
  vitais: {} as Vitais,
}

const novoId = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(9)))).replace(/\+/g, '-').replace(/\//g, '_')

export function medirRolagem() {
  const alto = document.documentElement.scrollHeight
  if (alto > 0) visita.rolagem = Math.max(visita.rolagem, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / alto) * 100)))
}

export function registrarVital(nome: keyof Vitais, valor: number) {
  visita.vitais[nome] = valor
}

export function iniciarVisita() {
  // Em desenvolvimento o React monta, desmonta e monta de novo o componente de uma vez: é a mesma visita, não duas.
  if (visita.pv && visita.caminho === location.pathname && Date.now() - visita.inicio < 1000) {
    visita.visivelDesde = document.visibilityState === 'visible' ? Date.now() : 0
    return
  }
  const primeira = visita.primeiroPv === null
  visita.pv = novoId()
  visita.caminho = location.pathname
  visita.inicio = Date.now()
  if (primeira) visita.primeiroPv = visita.pv
  visita.tempo = 0
  visita.visivelDesde = document.visibilityState === 'visible' ? Date.now() : 0
  visita.rolagem = 0
  medirRolagem()
  enviar({
    t: 'visita',
    c: location.pathname,
    pv: visita.pv,
    // A origem só vale para a página de entrada; as seguintes vieram do próprio site.
    ...(primeira && { ref: document.referrer, q: location.search }),
    w: window.innerWidth,
    l: navigator.language,
  })
}

/** A aba voltou a ficar visível: o tempo volta a contar. */
export function retomarVisita() {
  if (visita.pv && !visita.visivelDesde) visita.visivelDesde = Date.now()
}

/**
 * Manda o tempo, a rolagem e a velocidade da página que está acabando. Ao esconder a aba (talvez para sempre) a velocidade do
 * documento vai junto, na linha da primeira página; ao navegar dentro do site, ela ainda não está completa e fica para depois.
 */
export function encerrarVisita(motivo: 'ocultou' | 'navegou') {
  if (!visita.pv) return
  if (visita.visivelDesde) visita.tempo += Date.now() - visita.visivelDesde
  visita.visivelDesde = 0
  medirRolagem()
  const daPrimeira = visita.pv === visita.primeiroPv
  enviar({ t: 'saida', pv: visita.pv, s: Math.round(visita.tempo / 1000), p: visita.rolagem, ...(daPrimeira && { w: { ...visita.vitais } }) }, true)
  if (motivo === 'ocultou' && !daPrimeira && visita.primeiroPv) {
    enviar({ t: 'saida', pv: visita.primeiroPv, s: 0, p: 0, w: { ...visita.vitais } }, true)
  }
}
