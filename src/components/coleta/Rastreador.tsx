'use client'

// Medição de uso do site: visitas, tempo na página e cliques de contato. Sem cookies, sem armazenamento no aparelho.
// O que é enviado e o que fica gravado: docs/relatorios.md e a política de privacidade.
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ativarColeta, encerrarVisita, iniciarVisita, medirRolagem, registrar, retomarVisita } from '@/lib/coleta/cliente'
import type { TipoEvento } from '@/lib/coleta/tipos'

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

  // Uma visita por página aberta: a troca de caminho (navegação dentro do site) encerra a anterior e abre outra.
  useEffect(() => {
    const coletar = ativo && !caminho.startsWith('/admin')
    ativarColeta(coletar)
    if (!coletar) return
    iniciarVisita()
    return () => encerrarVisita()
  }, [ativo, caminho])

  useEffect(() => {
    if (!ativo) return
    let quadro = 0
    const aoRolar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(medirRolagem)
    }
    const aoMudarVisibilidade = () => (document.visibilityState === 'hidden' ? encerrarVisita() : retomarVisita())

    document.addEventListener('click', aoClicar, true)
    document.addEventListener('auxclick', aoClicar, true)
    document.addEventListener('focusin', aoFocar)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      cancelAnimationFrame(quadro)
      document.removeEventListener('click', aoClicar, true)
      document.removeEventListener('auxclick', aoClicar, true)
      document.removeEventListener('focusin', aoFocar)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [ativo])

  return null
}
