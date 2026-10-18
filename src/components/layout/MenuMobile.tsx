'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import logo from '@/assets/marca/logo-a3.png'
import { Icone } from '@/components/ui/Icone'
import { linkWhatsApp, site } from '@/lib/site'
import s from './MenuMobile.module.css'

interface LinkMenu {
  href: string
  rotulo: string
  chave: string
}

export function MenuMobile({ links, ativo }: { links: readonly LinkMenu[]; ativo?: string }) {
  const [aberto, setAberto] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const fecharRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('keydown', aoTeclar)
    const botao = botaoRef.current
    return () => {
      document.body.style.overflow = anterior
      document.removeEventListener('keydown', aoTeclar)
      botao?.focus()
    }
  }, [aberto])

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className={`btn-icone btn ${s.abrir}`}
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        onClick={() => setAberto(true)}
      >
        <Icone nome="menu" />
      </button>

      {aberto && (
        <>
          <div className={s.veu} onClick={() => setAberto(false)} aria-hidden="true" />
          <nav id="menu-mobile" aria-label="Menu" className={s.folha} role="dialog" aria-modal="true">
            <div className={s.topo}>
              <Image src={logo} alt={site.nome} width={41} height={36} />
              <button ref={fecharRef} type="button" className="btn btn-icone" aria-label="Fechar menu" onClick={() => setAberto(false)}>
                <Icone nome="fechar" espessura={2} />
              </button>
            </div>
            <ul className={s.lista}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={s.link}
                    aria-current={ativo === l.chave ? 'page' : undefined}
                    onClick={() => setAberto(false)}
                  >
                    {l.rotulo}
                    <Icone nome="seta" espessura={2} />
                  </Link>
                </li>
              ))}
            </ul>
            <a className="btn btn-sol btn-bloco" style={{ height: 54, fontSize: 16 }} href={linkWhatsApp()} target="_blank" rel="noopener">
              <Icone nome="whatsapp" tamanho={19} />
              Fale conosco
            </a>
            <span className={s.creci}>{site.creci}</span>
          </nav>
        </>
      )}
    </>
  )
}
