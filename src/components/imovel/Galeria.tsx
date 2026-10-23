'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import type { Foto } from '@/lib/imoveis/tipos'
import s from './Galeria.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

/**
 * Desktop: mosaico (foto principal + 4 miniaturas; clicar numa miniatura a promove).
 * Celular: carrossel com swipe, setas, pontos e contador.
 * As mesmas <img> servem aos dois layouts (via CSS), então nada é baixado em dobro.
 */
export function Galeria({ fotos }: { fotos: Foto[] }) {
  const [principal, setPrincipal] = useState(0)
  const [visivel, setVisivel] = useState(0)
  const [ampliada, setAmpliada] = useState<number | null>(null)
  const trilho = useRef<HTMLDivElement>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  const total = fotos.length

  // Miniaturas do mosaico: as 4 primeiras fotos que não são a principal.
  const miniaturas = fotos.map((_, i) => i).filter((i) => i !== principal).slice(0, 4)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (ampliada !== null && !d.open) d.showModal()
    if (ampliada === null && d.open) d.close()
  }, [ampliada])

  function irPara(i: number) {
    const el = trilho.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * ((i + total) % total), behavior: 'smooth' })
  }

  function aoClicar(i: number) {
    const celular = window.matchMedia('(max-width: 767px)').matches
    if (celular || i === principal) setAmpliada(i)
    else setPrincipal(i)
  }

  function navegarAmpliada(delta: number) {
    setAmpliada((a) => (a === null ? a : (a + delta + total) % total))
  }

  return (
    <div className={s.galeria} data-quantidade={Math.min(total, 5)}>
      <div
        ref={trilho}
        className={s.trilho}
        onScroll={(e) => {
          const el = e.currentTarget
          setVisivel(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)))
        }}
      >
        {fotos.map((foto, i) => {
          const ehPrincipal = i === principal
          const posicao = ehPrincipal ? 0 : miniaturas.indexOf(i) + 1
          return (
            <button
              key={foto.src}
              type="button"
              className={s.item}
              data-principal={ehPrincipal || undefined}
              data-fora-do-mosaico={posicao === 0 && !ehPrincipal ? true : undefined}
              style={{ ['--ordem' as string]: posicao }}
              onClick={() => aoClicar(i)}
              aria-label={ehPrincipal ? `Ampliar foto: ${foto.legenda ?? foto.alt}` : `Mostrar foto: ${foto.legenda ?? foto.alt}`}
            >
              <Image
                loader={carregadorImagem}
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1360px) 50vw, 680px"
                placeholder={foto.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={foto.blurDataURL}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
              />
              {foto.legenda && (
                <span className={s.legenda}>{foto.legenda}</span>
              )}
            </button>
          )
        })}
      </div>

      {total > 1 && (
        <button type="button" className={`btn ${s.verTodas}`} onClick={() => setAmpliada(principal)}>
          <Icone nome="grade" tamanho={18} />
          Ver todas as fotos ({total})
        </button>
      )}

      {total > 1 && (
        <div className={s.controlesMobile}>
          <span className={s.contador}>
            {visivel + 1} / {total}
          </span>
          <button type="button" className={`${s.seta} ${s.setaEsquerda}`} onClick={() => irPara(visivel - 1)} aria-label="Foto anterior">
            <Icone nome="chevron-esquerda" espessura={2.2} />
          </button>
          <button type="button" className={`${s.seta} ${s.setaDireita}`} onClick={() => irPara(visivel + 1)} aria-label="Próxima foto">
            <Icone nome="chevron-direita" espessura={2.2} />
          </button>
          <div className={s.pontos}>
            {fotos.map((f, i) => (
              <button
                key={f.src}
                type="button"
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === visivel || undefined}
                onClick={() => irPara(i)}
              />
            ))}
          </div>
        </div>
      )}

      <dialog
        ref={dialogo}
        className={s.lightbox}
        aria-label="Fotos do imóvel"
        onClose={() => setAmpliada(null)}
        onClick={(e) => e.target === e.currentTarget && setAmpliada(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') navegarAmpliada(1)
          if (e.key === 'ArrowLeft') navegarAmpliada(-1)
        }}
      >
        {ampliada !== null && (
          <figure className={s.lightboxFigura}>
            <div className={s.lightboxImagem}>
              <Image loader={carregadorImagem} src={fotos[ampliada]!.src} alt={fotos[ampliada]!.alt} fill sizes="100vw" />
            </div>
            <figcaption>
              <span>{fotos[ampliada]!.legenda}</span>
              <span>
                {ampliada + 1} / {total}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className={`${s.seta} ${s.lightboxFechar}`} onClick={() => setAmpliada(null)} aria-label="Fechar">
          <Icone nome="fechar" espessura={2.2} />
        </button>
        {total > 1 && (
          <>
            <button type="button" className={`${s.seta} ${s.setaEsquerda}`} onClick={() => navegarAmpliada(-1)} aria-label="Foto anterior">
              <Icone nome="chevron-esquerda" espessura={2.2} />
            </button>
            <button type="button" className={`${s.seta} ${s.setaDireita}`} onClick={() => navegarAmpliada(1)} aria-label="Próxima foto">
              <Icone nome="chevron-direita" espessura={2.2} />
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
