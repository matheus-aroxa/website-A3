// Navegador, sistema e aparelho a partir do User-Agent. Só o resultado (ex.: "Chrome", "Android") é gravado, nunca o texto original.

const ROBO =
  /bot\b|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|python|curl\/|wget|httpclient|axios|node-fetch|go-http|java\/|scrapy|phantom|selenium|puppeteer|playwright|chrome-lighthouse|bingpreview|petalbot|semrush|ahrefs|mj12|dotbot/i

export const ehRobo = (agente: string) => agente.length < 10 || ROBO.test(agente)

export type Dispositivo = 'celular' | 'tablet' | 'computador'

export interface Agente {
  dispositivo: Dispositivo
  navegador: string
  so: string
}

function navegadorDe(ua: string) {
  // Navegadores embutidos de redes sociais primeiro: o UA deles também diz Chrome/Safari.
  if (/Instagram/i.test(ua)) return 'Instagram (no app)'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook (no app)'
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok (no app)'
  if (/EdgA?\/|Edge\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet'
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox'
  if (/Chrome\/|CriOS/.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Outro'
}

function sistemaDe(ua: string) {
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/Linux|X11/i.test(ua)) return 'Linux'
  return 'Outro'
}

/** A largura da janela manda; sem ela, o próprio User-Agent diz se é celular ou tablet. */
export function lerAgente(ua: string, largura?: number): Agente {
  let dispositivo: Dispositivo
  if (largura) dispositivo = largura < 768 ? 'celular' : largura < 1100 ? 'tablet' : 'computador'
  else if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) dispositivo = 'tablet'
  else dispositivo = /Mobi|iPhone|Android/i.test(ua) ? 'celular' : 'computador'
  return { dispositivo, navegador: navegadorDe(ua), so: sistemaDe(ua) }
}
