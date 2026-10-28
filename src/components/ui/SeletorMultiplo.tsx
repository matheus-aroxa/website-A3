'use client'

// Variante do `Seletor` (mesmas classes e mesmo comportamento de teclado) em que várias opções podem ser marcadas.
// A lista fica aberta enquanto se marca; a primeira opção ("Todas…") desmarca tudo e fecha.

import { useEffect, useId, useRef, useState } from 'react'
import { Icone } from './Icone'
import type { OpcaoSeletor } from './Seletor'

export function SeletorMultiplo({
  opcoes,
  valores,
  aoMudar,
  rotuloVazio,
  rotuloVarios,
  className,
  'aria-label': ariaLabel,
}: {
  opcoes: OpcaoSeletor[]
  valores: string[]
  aoMudar: (valores: string[]) => void
  /** Texto do botão e da primeira opção quando nada está marcado, como "Todas as construtoras". */
  rotuloVazio: string
  /** Texto do botão com mais de uma opção marcada. */
  rotuloVarios: (quantidade: number) => string
  className?: string
  'aria-label'?: string
}) {
  const planas = [{ valor: '', rotulo: rotuloVazio }, ...opcoes]
  const marcadas = opcoes.filter((o) => valores.includes(o.valor))
  const resumo = marcadas.length === 0 ? rotuloVazio : marcadas.length === 1 ? marcadas[0]!.rotulo : rotuloVarios(marcadas.length)
  const marcada = (o: OpcaoSeletor) => (o.valor ? valores.includes(o.valor) : valores.length === 0)

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const raizRef = useRef<HTMLSpanElement>(null)
  const busca = useRef({ texto: '', ate: 0 })
  const id = useId()
  const idOpcao = (i: number) => `${id}-op-${i}`

  useEffect(() => {
    if (!aberto) return
    const aoClicarFora = (e: PointerEvent) => {
      if (!raizRef.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('pointerdown', aoClicarFora)
    return () => document.removeEventListener('pointerdown', aoClicarFora)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    document.getElementById(idOpcao(ativo))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, ativo])

  function abrir() {
    setAtivo(Math.max(0, planas.findIndex(marcada)))
    setAberto(true)
  }

  function alternar(i: number) {
    const opcao = planas[i]
    if (!opcao) return
    if (!opcao.valor) {
      setAberto(false)
      if (valores.length) aoMudar([])
      return
    }
    aoMudar(valores.includes(opcao.valor) ? valores.filter((v) => v !== opcao.valor) : [...valores, opcao.valor])
  }

  function aoTeclar(e: React.KeyboardEvent) {
    const ultimo = planas.length - 1
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        abrir()
      }
      return
    }
    const mover = (i: number) => {
      e.preventDefault()
      setAtivo(Math.min(ultimo, Math.max(0, i)))
    }
    switch (e.key) {
      case 'ArrowDown':
        return mover(ativo + 1)
      case 'ArrowUp':
        return mover(ativo - 1)
      case 'Home':
        return mover(0)
      case 'End':
        return mover(ultimo)
      case 'PageDown':
        return mover(ativo + 8)
      case 'PageUp':
        return mover(ativo - 8)
      case 'Enter':
      case ' ':
        e.preventDefault()
        return alternar(ativo)
      case 'Escape':
        e.preventDefault()
        return setAberto(false)
      case 'Tab':
        return setAberto(false)
    }
    if (e.key.length === 1) {
      const agora = Date.now()
      busca.current = { texto: (agora < busca.current.ate ? busca.current.texto : '') + e.key.toLowerCase(), ate: agora + 600 }
      const achada = planas.findIndex((o) => o.rotulo.toLowerCase().startsWith(busca.current.texto))
      if (achada >= 0) setAtivo(achada)
    }
  }

  return (
    <span ref={raizRef} className={`seletor ${className ?? ''}`} data-aberto={aberto || undefined}>
      <button
        type="button"
        role="combobox"
        className="campo seletor-botao"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={aberto ? idOpcao(ativo) : undefined}
        onClick={(e) => {
          e.preventDefault()
          if (aberto) setAberto(false)
          else abrir()
        }}
        onKeyDown={aoTeclar}
        onBlur={(e) => {
          if (!raizRef.current?.contains(e.relatedTarget as Node)) setAberto(false)
        }}
      >
        <span className="seletor-valor">{resumo}</span>
        <Icone nome="chevron-baixo" tamanho={18} espessura={2} className="seletor-seta" />
      </button>
      {aberto && (
        <ul id={`${id}-lista`} role="listbox" aria-multiselectable className="seletor-lista" tabIndex={-1} aria-label={ariaLabel}>
          {planas.map((o, i) => (
            <li
              key={o.valor}
              id={idOpcao(i)}
              role="option"
              aria-selected={marcada(o)}
              data-ativo={i === ativo || undefined}
              className="seletor-opcao"
              onPointerMove={() => setAtivo(i)}
              onMouseDown={(e) => e.preventDefault()} // a lista segue aberta, então o foco fica no botão para o teclado
              onClick={(e) => {
                e.preventDefault() // não reabre pelo <label> que envolve o seletor
                setAtivo(i)
                alternar(i)
              }}
            >
              <span>{o.rotulo}</span>
              {marcada(o) && <Icone nome="check" tamanho={18} espessura={2.2} />}
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
