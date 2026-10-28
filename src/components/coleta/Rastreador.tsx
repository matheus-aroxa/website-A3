'use client'

// Medição de uso do site: visitas, tempo na página, cliques de contato, erros e velocidade. Sem cookies, sem armazenamento no
// aparelho. O que é enviado e o que fica gravado: docs/relatorios.md e a política de privacidade.
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'
import {
  ativarColeta,
  encerrarVisita,
  iniciarVisita,
  medirRolagem,
  registrar,
  registrarVital,
  retomarVisita,
} from '@/lib/coleta/cliente'
import type { TipoEvento } from '@/lib/coleta/tipos'

const NOME_VITAL = { LCP: 'lcp', CLS: 'cls', INP: 'inp', FCP: 'fcp', TTFB: 'ttfb' } as const

/** Clique em link de contato, link externo ou imóvel; ou em qualquer elemento marcado com data-evento. */
function aoClicar(e: MouseEvent) {
  const alvo = e.target instanceof Element ? e.target : null
  const marcado = alvo?.closest<HTMLElement>('[data-evento]')
  if (marcado) return registrar(marcado.dataset.evento as TipoEvento, { r: marcado.dataset.rotulo, i: marcado.dataset.imovel })

  const link = alvo?.closest<HTMLAnchorElement>('a[href]')
  if (!link) return
  const href = link.getAttribute('href') ?? ''
  const rotulo = link.closest<HTMLElement>('[data-rastro]')?.dataset.rastro ?? 'outro'
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return registrar('whatsapp', { r: rotulo })
  if (href.startsWith('tel:')) return registrar('ligacao', { r: rotulo })
  if (href.startsWith('mailto:')) return registrar('email', { r: rotulo })
  if (link.origin !== location.origin) return registrar('externo', { r: link.hostname.replace(/^www\./, '').slice(0, 80) })
  if (link.pathname.startsWith('/imovel/') && link.pathname !== location.pathname) {
    const slug = decodeURIComponent(link.pathname.slice('/imovel/'.length)).replace(/\/$/, '')
    registrar('card', { i: slug, r: link.closest<HTMLElement>('[data-lista]')?.dataset.lista ?? 'link' })
  }
}

/** Primeira vez que a pessoa mexe num formulário de contato (os dados digitados nunca são lidos). */
const iniciados = new WeakSet<Element>()
function aoFocar(e: FocusEvent) {
  const form = e.target instanceof Element ? e.target.closest<HTMLFormElement>('form[data-formulario]') : null
  if (!form || iniciados.has(form)) return
  iniciados.add(form)
  registrar('formulario-iniciado', { r: form.dataset.formulario })
}

export function Rastreador({ ativo }: { ativo: boolean }) {
  const caminho = usePathname()

  useReportWebVitals((m) => {
    const nome = NOME_VITAL[m.name as keyof typeof NOME_VITAL]
    if (nome) registrarVital(nome, m.value)
  })

  // Uma visita por página aberta: a troca de caminho (navegação dentro do site) encerra a anterior e abre outra.
  useEffect(() => {
    const coletar = ativo && !caminho.startsWith('/admin')
    ativarColeta(coletar)
    if (!coletar) return
    iniciarVisita()
    return () => encerrarVisita('navegou')
  }, [ativo, caminho])

  useEffect(() => {
    if (!ativo) return
    let quadro = 0
    const aoRolar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(medirRolagem)
    }
    const aoMudarVisibilidade = () => (document.visibilityState === 'hidden' ? encerrarVisita('ocultou') : retomarVisita())

    // Erros de JavaScript do próprio site (no máximo 3 por página aberta, para um erro em laço não encher o banco).
    let erros = 0
    const aoErrar = (e: ErrorEvent) => {
      if (erros >= 3 || !e.filename?.startsWith(location.origin)) return
      erros++
      registrar('erro', { r: (e.message || 'erro').slice(0, 150), d: { a: e.filename.split('/').pop()?.slice(0, 60) ?? '', l: e.lineno } })
    }
    const aoRejeitar = (e: PromiseRejectionEvent) => {
      if (erros >= 3) return
      erros++
      registrar('erro', { r: `Promise rejeitada: ${String((e.reason as Error | undefined)?.message ?? e.reason ?? '').slice(0, 120)}` })
    }

    document.addEventListener('click', aoClicar, true)
    document.addEventListener('auxclick', aoClicar, true)
    document.addEventListener('focusin', aoFocar)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('error', aoErrar)
    window.addEventListener('unhandledrejection', aoRejeitar)
    return () => {
      cancelAnimationFrame(quadro)
      document.removeEventListener('click', aoClicar, true)
      document.removeEventListener('auxclick', aoClicar, true)
      document.removeEventListener('focusin', aoFocar)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('error', aoErrar)
      window.removeEventListener('unhandledrejection', aoRejeitar)
    }
  }, [ativo])

  return null
}
