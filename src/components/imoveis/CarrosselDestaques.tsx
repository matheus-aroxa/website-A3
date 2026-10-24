'use client'

// Destaques da home. Até `porVez` imóveis ficam em grade, sem controles. Com mais, viram um carrossel de rolagem
// (scroll-snap) que passa sozinho de tempos em tempos, tem botões de anterior/próximo e dá a volta ao chegar no fim.
// Os cards chegam prontos do servidor (`children`); aqui só entra a navegação.

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import s from './CarrosselDestaques.module.css'

const INTERVALO_MS = 6000

/** Tamanho de um passo (os cards que cabem de uma vez) e até onde dá para rolar. */
function medidas(el: HTMLElement) {
  const [primeiro, segundo] = [el.children[0] as HTMLElement | undefined, el.children[1] as HTMLElement | undefined]
  const largura = primeiro && segundo ? segundo.offsetLeft - primeiro.offsetLeft : el.clientWidth // card + espaço
  const gap = primeiro ? largura - primeiro.offsetWidth : 0
  const porPagina = Math.max(1, Math.round((el.clientWidth + gap) / largura))
  return { passo: porPagina * largura, fim: el.scrollWidth - el.clientWidth }
}
/** Depois de tocar na tela, o carrossel espera um pouco antes de voltar a passar sozinho. */
const RETOMAR_APOS_TOQUE_MS = 5000

export function CarrosselDestaques({ children, porVez, classeGrade }: { children: ReactNode; porVez: number; classeGrade?: string }) {
  const itens = Children.toArray(children)
  const carrossel = itens.length > porVez
  const pista = useRef<HTMLDivElement>(null)
  const pausado = useRef(false)
  const retomar = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [rolavel, setRolavel] = useState(false)
  const [paginas, setPaginas] = useState({ total: 1, atual: 0 })

  // Só mostra os controles quando há mesmo o que rolar (na tela larga com poucos cards, tudo cabe). "Página" é o
  // tanto de cards que cabe de uma vez; o scroll-snap alinha cada passo no início de um card.
  useEffect(() => {
    const el = pista.current
    if (!carrossel || !el) return
    const medir = () => {
      const m = medidas(el)
      setRolavel(m.fim > 2)
      const total = m.fim > 2 ? Math.ceil(m.fim / m.passo - 0.05) + 1 : 1
      setPaginas({ total, atual: el.scrollLeft >= m.fim - 4 ? total - 1 : Math.min(total - 1, Math.round(el.scrollLeft / m.passo)) })
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    el.addEventListener('scroll', medir, { passive: true })
    return () => {
      observador.disconnect()
      el.removeEventListener('scroll', medir)
    }
  }, [carrossel, itens.length])

  const passar = useCallback((direcao: 1 | -1) => {
    const el = pista.current
    if (!el || el.children.length < 2) return
    const { passo, fim } = medidas(el)
    let alvo = el.scrollLeft + direcao * passo
    if (direcao === 1 && el.scrollLeft >= fim - 4) alvo = 0 // passou do último: volta ao primeiro
    else if (direcao === -1 && el.scrollLeft <= 4) alvo = fim // antes do primeiro: vai ao último
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: alvo, behavior: reduzido ? 'auto' : 'smooth' })
  }, [])

  // Passa sozinho, a não ser que a pessoa esteja interagindo, a aba esteja em segundo plano ou ela prefira menos movimento.
  useEffect(() => {
    if (!carrossel || !rolavel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tempo = setInterval(() => {
      if (!pausado.current && !document.hidden) passar(1)
    }, INTERVALO_MS)
    return () => clearInterval(tempo)
  }, [carrossel, rolavel, passar])
  useEffect(() => () => clearTimeout(retomar.current), [])

  if (!carrossel) {
    return (
      <div className={`${classeGrade ?? ''} carrossel-mobile`} data-revelar-filhos>
        {itens}
      </div>
    )
  }

  const pausar = () => {
    clearTimeout(retomar.current)
    pausado.current = true
  }
  const continuar = (apos = 0) => {
    clearTimeout(retomar.current)
    retomar.current = setTimeout(() => (pausado.current = false), apos)
  }

  return (
    <div
      className={s.carrossel}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Imóveis em destaque"
      onMouseEnter={pausar}
      onMouseLeave={() => continuar()}
      onFocus={pausar}
      onBlur={() => continuar()}
      onTouchStart={pausar}
      onTouchEnd={() => continuar(RETOMAR_APOS_TOQUE_MS)}
    >
      {/* Setas nas laterais, fora dos cards (no celular, sem espaço ao lado, vão para a linha de baixo, com os pontos). */}
      <div className={s.palco} data-controles={rolavel || undefined}>
        <div ref={pista} className={s.pista} data-revelar-filhos>
          {itens}
        </div>
        {rolavel && (
          <>
            <button type="button" className={`${s.seta} ${s.anterior}`} onClick={() => passar(-1)} aria-label="Destaques anteriores">
              <Icone nome="seta-esquerda" tamanho={20} espessura={2.2} />
            </button>
            <span className={s.pontos} aria-hidden="true">
              {Array.from({ length: paginas.total }, (_, i) => (
                <span key={i} className={s.ponto} data-ativo={i === paginas.atual || undefined} />
              ))}
            </span>
            <button type="button" className={`${s.seta} ${s.proximo}`} onClick={() => passar(1)} aria-label="Próximos destaques">
              <Icone nome="seta" tamanho={20} espessura={2.2} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
