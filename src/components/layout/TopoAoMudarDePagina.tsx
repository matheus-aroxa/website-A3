'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** A busca troca de caminho a cada filtro de categoria/tipo/local; para a rolagem, é tudo a mesma página. */
const paginaDe = (caminho: string) => (caminho.startsWith('/imoveis') ? '/imoveis' : caminho)

/**
 * Ao trocar de página (inclusive pelos links que navegam com `scroll={false}`), leva ao topo com transição suave.
 * Links com âncora (`/#contato`) vão para a seção, não para o topo. Mudar só filtros ou a paginação da mesma página não rola, e voltar/avançar no histórico mantém a posição salva.
 * Repete o pedido por menos de meio segundo porque o Next pode reposicionar a página logo depois do primeiro commit.
 */
export function TopoAoMudarDePagina() {
  const caminho = usePathname()
  const anterior = useRef<string | null>(null)
  const pelaHistoria = useRef(false)

  useEffect(() => {
    const marcar = () => (pelaHistoria.current = true)
    window.addEventListener('popstate', marcar)
    return () => window.removeEventListener('popstate', marcar)
  }, [])

  useEffect(() => {
    const pagina = paginaDe(caminho)
    const trocou = anterior.current !== null && anterior.current !== pagina
    anterior.current = pagina
    const voltando = pelaHistoria.current
    pelaHistoria.current = false
    // Link com âncora (ex.: /#contato): a seção do hash é o destino, não o topo.
    if (!trocou || voltando || window.location.hash) return

    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const topo = () => {
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'instant' : 'smooth' })
    }
    topo()
    const repeticoes = [120, 400].map((ms) => setTimeout(topo, ms))
    return () => repeticoes.forEach(clearTimeout)
  }, [caminho])

  return null
}
