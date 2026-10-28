// De onde a pessoa veio: canal (grupo), origem (nome do site/app) e campanha, a partir do site de referência e dos
// parâmetros utm_* do endereço. Um endereço de referência só é guardado como o nome da origem (ex.: "google"), sem caminho.

export type Canal = 'direto' | 'busca' | 'redes-sociais' | 'whatsapp' | 'email' | 'pago' | 'sites'

export interface Origem {
  canal: Canal
  origem: string | null
  campanha: string | null
}

const BUSCA = [
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)ecosia\.org$/, 'ecosia'],
  [/(^|\.)yandex\./, 'yandex'],
  [/(^|\.)brave\.com$/, 'brave'],
  [/googlequicksearchbox/, 'google'],
] as const

const REDES = [
  [/(^|\.)instagram\.com$|com\.instagram/, 'instagram'],
  [/(^|\.)(facebook|fb)\.com$|(^|\.)fb\.me$|com\.facebook/, 'facebook'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)pinterest\./, 'pinterest'],
  [/(^|\.)(telegram\.org|t\.me)$/, 'telegram'],
] as const

const WHATSAPP = /(^|\.)(whatsapp\.com|wa\.me)$|com\.whatsapp/
const EMAIL = /^(mail|outlook|webmail)\.|(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|yahoo\.com)$|com\.google\.android\.gm/

const limpar = (v: string | null | undefined, max = 60) => (v ?? '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, max) || null

/** Nome do site de referência, sem "www." e sem caminho; `null` se vier do próprio site ou for inválido. */
export function hostDaReferencia(referencia: string | undefined, hostsDoSite: string[]) {
  if (!referencia) return null
  try {
    const url = new URL(referencia)
    const host = (url.protocol === 'android-app:' ? url.hostname || url.pathname.replace(/^\/+/, '') : url.hostname).replace(/^www\./, '').toLowerCase()
    if (!host || hostsDoSite.includes(host)) return null
    return host.slice(0, 80)
  } catch {
    return null
  }
}

export function classificarOrigem(entrada: { referencia?: string; query?: string; agente: string; hostsDoSite: string[] }): Origem {
  const sp = new URLSearchParams(entrada.query ?? '')
  const utmFonte = limpar(sp.get('utm_source'))
  const utmMeio = limpar(sp.get('utm_medium'))
  const campanha = limpar(sp.get('utm_campaign'), 80)
  const host = hostDaReferencia(entrada.referencia, entrada.hostsDoSite)
  const nomeDe = (lista: readonly (readonly [RegExp, string])[], h: string | null) => (h ? lista.find(([re]) => re.test(h))?.[1] : undefined)

  // Parâmetros da campanha mandam sobre o site de referência.
  if (utmMeio && /^(cpc|ppc|paid|paidsocial|paid-social|display|ads?|anuncio|patrocinado)$/.test(utmMeio)) return { canal: 'pago', origem: utmFonte, campanha }
  if (sp.has('gclid')) return { canal: 'pago', origem: 'google', campanha }
  if (utmMeio === 'email' || utmMeio === 'e-mail' || utmFonte === 'newsletter') return { canal: 'email', origem: utmFonte, campanha }
  if (utmFonte) {
    const rede = REDES.find(([re]) => re.test(`${utmFonte}.com`))?.[1]
    if (rede) return { canal: 'redes-sociais', origem: rede, campanha }
    if (utmFonte === 'whatsapp') return { canal: 'whatsapp', origem: 'whatsapp', campanha }
    const busca = nomeDe(BUSCA, `${utmFonte}.com`)
    if (busca) return { canal: 'busca', origem: busca, campanha }
    return { canal: 'sites', origem: utmFonte, campanha }
  }

  const busca = nomeDe(BUSCA, host)
  if (busca) return { canal: 'busca', origem: busca, campanha }
  const rede = nomeDe(REDES, host)
  if (rede) return { canal: 'redes-sociais', origem: rede, campanha }
  if (host && WHATSAPP.test(host)) return { canal: 'whatsapp', origem: 'whatsapp', campanha }
  if (host && EMAIL.test(host)) return { canal: 'email', origem: host, campanha }
  if (host) return { canal: 'sites', origem: host, campanha }

  // Sem referência: os navegadores dos aplicativos entregam a página sem dizer de onde, mas o User-Agent diz de qual app.
  if (/Instagram/i.test(entrada.agente)) return { canal: 'redes-sociais', origem: 'instagram', campanha }
  if (/FBAN|FBAV|FB_IAB/i.test(entrada.agente)) return { canal: 'redes-sociais', origem: 'facebook', campanha }
  if (/TikTok|musical_ly/i.test(entrada.agente)) return { canal: 'redes-sociais', origem: 'tiktok', campanha }
  return { canal: 'direto', origem: null, campanha }
}
