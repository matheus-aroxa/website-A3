// Lado do navegador da medição de uso. O que é enviado e o que o servidor faz com isso: docs/relatorios.md.
// Nada é guardado no aparelho (sem cookie, localStorage ou sessionStorage): o identificador da visita só existe na memória da página.
import type { Carga, CargaEvento, TipoEvento } from './tipos'

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

const visita = {
  pv: null as string | null,
  caminho: '',
  /** Quando a visita atual começou (ms). */
  inicio: 0,
  /** Se o documento já registrou uma página: a origem só vai na primeira. */
  jaVisitou: false,
  /** Tempo com a aba visível já somado, em ms. */
  tempo: 0,
  /** Quando o trecho visível em andamento começou (0 se a aba está escondida). */
  visivelDesde: 0,
  rolagem: 0,
}

const novoId = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(9)))).replace(/\+/g, '-').replace(/\//g, '_')

export function medirRolagem() {
  const alto = document.documentElement.scrollHeight
  if (alto > 0) visita.rolagem = Math.max(visita.rolagem, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / alto) * 100)))
}

export function iniciarVisita() {
  // Em desenvolvimento o React monta, desmonta e monta de novo o componente de uma vez: é a mesma visita, não duas.
  if (visita.pv && visita.caminho === location.pathname && Date.now() - visita.inicio < 1000) {
    visita.visivelDesde = document.visibilityState === 'visible' ? Date.now() : 0
    return
  }
  const primeira = !visita.jaVisitou
  visita.jaVisitou = true
  visita.pv = novoId()
  visita.caminho = location.pathname
  visita.inicio = Date.now()
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

/** Manda o tempo e a rolagem da página que está acabando (a pessoa navegou para outra ou escondeu a aba). */
export function encerrarVisita() {
  if (!visita.pv) return
  if (visita.visivelDesde) visita.tempo += Date.now() - visita.visivelDesde
  visita.visivelDesde = 0
  medirRolagem()
  enviar({ t: 'saida', pv: visita.pv, s: Math.round(visita.tempo / 1000), p: visita.rolagem }, true)
}
