'use client'

// Campo de texto livre com lista de sugestões no estilo do site (as mesmas classes do `Seletor`), no lugar do
// <datalist> nativo, que cada navegador desenha de um jeito. Segue o padrão "combobox com autocompletar" da
// WAI-ARIA: o foco fica no campo e a opção ativa é indicada por aria-activedescendant. Digitar filtra a lista.

import { useEffect, useId, useState } from 'react'
import { normalizarBusca } from '@/lib/imoveis/formato'
import { Icone } from './Icone'

export function CampoComSugestoes({
  valor,
  aoMudar,
  sugestoes,
  name,
  maxLength,
  placeholder,
  desativado,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: {
  valor: string
  aoMudar: (valor: string) => void
  sugestoes: string[]
  name?: string
  maxLength?: number
  placeholder?: string
  desativado?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)

  const busca = normalizarBusca(valor)
  const opcoes = sugestoes.filter((s) => normalizarBusca(s).includes(busca))
  const visivel = aberto && opcoes.length > 0 && !desativado
  const idOpcao = (i: number) => `${id}-op-${i}`

  useEffect(() => {
    if (visivel && ativo >= 0) document.getElementById(`${id}-op-${ativo}`)?.scrollIntoView({ block: 'nearest' })
  }, [visivel, ativo, id])

  function escolher(opcao: string) {
    aoMudar(opcao)
    setAberto(false)
    setAtivo(-1)
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!opcoes.length) return
      e.preventDefault()
      if (!visivel) {
        setAberto(true)
        setAtivo(e.key === 'ArrowDown' ? 0 : opcoes.length - 1)
        return
      }
      const passo = e.key === 'ArrowDown' ? 1 : -1
      const proximo = ativo + passo
      setAtivo(proximo < 0 ? opcoes.length - 1 : proximo >= opcoes.length ? 0 : proximo)
    } else if (e.key === 'Enter' && visivel && ativo >= 0) {
      e.preventDefault() // escolher a sugestão, não enviar o formulário
      escolher(opcoes[ativo]!)
    } else if (e.key === 'Escape' && visivel) {
      e.preventDefault()
      setAberto(false)
    }
  }

  return (
    <span className="seletor">
      <input
        className="campo"
        name={name}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visivel}
        aria-controls={`${id}-lista`}
        aria-activedescendant={visivel && ativo >= 0 ? idOpcao(ativo) : undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        autoComplete="off"
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={desativado}
        value={valor}
        onChange={(e) => {
          aoMudar(e.target.value)
          setAberto(true)
          setAtivo(-1)
        }}
        onFocus={() => setAberto(true)}
        onClick={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
      />
      {visivel && (
        // O clique numa opção não pode tirar o foco do campo (senão o onBlur fecharia a lista antes do onClick).
        <ul id={`${id}-lista`} role="listbox" className="seletor-lista" onPointerDown={(e) => e.preventDefault()}>
          {opcoes.map((opcao, i) => (
            <li
              key={opcao}
              id={idOpcao(i)}
              role="option"
              aria-selected={opcao === valor}
              data-ativo={i === ativo || undefined}
              className="seletor-opcao"
              onPointerMove={() => setAtivo(i)}
              onClick={(e) => {
                e.preventDefault() // o <label> que envolve o campo repassaria o clique ao input e reabriria a lista
                escolher(opcao)
              }}
            >
              <span>{opcao}</span>
              {opcao === valor && <Icone nome="check" tamanho={18} espessura={2.2} />}
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
