'use client'

// Substituto do <select> nativo com a lista de opções no estilo do site.
// Segue o padrão "select-only combobox" da WAI-ARIA: o foco fica no botão e a opção ativa
// é indicada por aria-activedescendant. Com `name`, envia o valor em formulários via input oculto.

import { useEffect, useId, useRef, useState } from 'react'
import { Icone } from './Icone'

export interface OpcaoSeletor {
  valor: string
  rotulo: string
}

export interface GrupoSeletor {
  rotulo: string
  opcoes: OpcaoSeletor[]
}

type Item = OpcaoSeletor | GrupoSeletor

const ehGrupo = (item: Item): item is GrupoSeletor => 'opcoes' in item

export function Seletor({
  opcoes,
  valor: valorControlado,
  valorInicial,
  aoMudar,
  name,
  className,
  desativado,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: {
  opcoes: Item[]
  valor?: string
  valorInicial?: string
  aoMudar?: (valor: string) => void
  name?: string
  className?: string
  desativado?: boolean
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  const planas = opcoes.flatMap((item) => (ehGrupo(item) ? item.opcoes : [item]))
  const [valorInterno, setValorInterno] = useState(valorInicial ?? planas[0]?.valor ?? '')
  const valor = valorControlado ?? valorInterno
  const selecionada = planas.find((o) => o.valor === valor) ?? planas[0]

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const raizRef = useRef<HTMLSpanElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
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
    setAtivo(Math.max(0, planas.findIndex((o) => o.valor === valor)))
    setAberto(true)
  }

  function escolher(i: number) {
    const opcao = planas[i]
    setAberto(false)
    if (!opcao || opcao.valor === valor) return
    setValorInterno(opcao.valor)
    aoMudar?.(opcao.valor)
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
        return escolher(ativo)
      case 'Escape':
        e.preventDefault()
        return setAberto(false)
      case 'Tab':
        return escolher(ativo)
    }
    // Digitar as primeiras letras pula para a opção correspondente, como no <select>.
    if (e.key.length === 1) {
      const agora = Date.now()
      busca.current = { texto: (agora < busca.current.ate ? busca.current.texto : '') + e.key.toLowerCase(), ate: agora + 600 }
      const achada = planas.findIndex((o) => o.rotulo.toLowerCase().startsWith(busca.current.texto))
      if (achada >= 0) setAtivo(achada)
    }
  }

  let indice = 0
  const renderOpcao = (o: OpcaoSeletor) => {
    const i = indice++
    return (
      <li
        key={o.valor}
        id={idOpcao(i)}
        role="option"
        aria-selected={o.valor === valor}
        data-ativo={i === ativo || undefined}
        className="seletor-opcao"
        onPointerMove={() => setAtivo(i)}
        onClick={(e) => {
          e.preventDefault() // não reabre pelo <label> que envolve o seletor
          escolher(i)
        }}
      >
        <span>{o.rotulo}</span>
        {o.valor === valor && <Icone nome="check" tamanho={18} espessura={2.2} />}
      </li>
    )
  }

  return (
    <span ref={raizRef} className={`seletor ${className ?? ''}`} data-aberto={aberto || undefined}>
      {name && <input type="hidden" name={name} value={valor} />}
      <button
        type="button"
        role="combobox"
        className="campo seletor-botao"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        disabled={desativado}
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
        <span className="seletor-valor">{selecionada?.rotulo}</span>
        <Icone nome="chevron-baixo" tamanho={18} espessura={2} className="seletor-seta" />
      </button>
      {aberto && (
        <ul ref={listaRef} id={`${id}-lista`} role="listbox" className="seletor-lista" tabIndex={-1} aria-label={ariaLabel}>
          {opcoes.map((item) =>
            ehGrupo(item) ? (
              <li key={`g-${item.rotulo}`} role="presentation">
                <span className="seletor-grupo" aria-hidden="true">
                  {item.rotulo}
                </span>
                <ul role="group" aria-label={item.rotulo}>
                  {item.opcoes.map(renderOpcao)}
                </ul>
              </li>
            ) : (
              renderOpcao(item)
            ),
          )}
        </ul>
      )}
    </span>
  )
}
