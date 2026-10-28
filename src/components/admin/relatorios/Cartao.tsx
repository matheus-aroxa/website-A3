'use client'

// Cartão de um gráfico: título, o gráfico, a mesma informação em tabela (alternativa acessível e base da exportação) e a dica
// que aparece ao passar o mouse ou focar uma marca. A dica é lida de `data-dica` (JSON) das marcas, por delegação de eventos.
import { useState, type ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import type { DadosDaDica } from './dica'
import s from './Relatorios.module.css'

function lerDica(el: Element | null): DadosDaDica | null {
  const bruto = el?.closest('[data-dica]')?.getAttribute('data-dica')
  if (!bruto) return null
  try {
    const dados = JSON.parse(bruto) as DadosDaDica
    return Array.isArray(dados.l) ? dados : null
  } catch {
    return null
  }
}

export function Cartao({
  titulo,
  descricao,
  tabela,
  rodape,
  children,
  acao,
}: {
  titulo: string
  descricao?: ReactNode
  /** O mesmo conteúdo do gráfico, em tabela. */
  tabela?: ReactNode
  rodape?: ReactNode
  children: ReactNode
  /** Controle extra à direita do título. */
  acao?: ReactNode
}) {
  const [verTabela, setVerTabela] = useState(false)
  const [aberta, setAberta] = useState<{ x: number; y: number; direita: boolean; dados: DadosDaDica } | null>(null)

  function mostrar(alvo: Element | null, cx: number, cy: number, caixa: DOMRect) {
    const dados = lerDica(alvo)
    if (!dados) return setAberta(null)
    const x = cx - caixa.left
    setAberta({ x, y: cy - caixa.top, direita: x > caixa.width / 2, dados })
  }

  return (
    <section
      className={s.cartao}
      data-cartao
      data-titulo={titulo}
      onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons ? mostrar(e.target as Element, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()) : undefined)}
      onPointerDown={(e) => mostrar(e.target as Element, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onPointerLeave={() => setAberta(null)}
      onFocus={(e) => {
        const r = (e.target as Element).getBoundingClientRect()
        mostrar(e.target as Element, r.left + r.width / 2, r.top, e.currentTarget.getBoundingClientRect())
      }}
      onBlur={() => setAberta(null)}
    >
      <div className={s.cartaoTopo}>
        <div className={s.cartaoTitulos}>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {acao}
        {tabela && (
          <button type="button" className={s.alternar} aria-pressed={verTabela} onClick={() => setVerTabela((v) => !v)}>
            <Icone nome={verTabela ? 'grafico' : 'tabela'} tamanho={16} />
            {verTabela ? 'Ver gráfico' : 'Ver tabela'}
          </button>
        )}
      </div>
      <div className={s.visaoGrafico} hidden={verTabela}>
        {children}
      </div>
      {tabela && (
        <div className={s.visaoTabela} hidden={!verTabela}>
          {tabela}
        </div>
      )}
      {rodape && <p className={s.rodapeCartao}>{rodape}</p>}
      {aberta && (
        <div className={s.dica} style={{ left: aberta.x, top: aberta.y, transform: `translate(${aberta.direita ? 'calc(-100% - 14px)' : '14px'}, -110%)` }} role="status">
          {aberta.dados.t && <header>{aberta.dados.t}</header>}
          {aberta.dados.l.map(([nome, valor, cor], i) => (
            <div key={i} className={s.dicaLinha}>
              {cor && <i className={s.chave} data-forma="linha" style={{ ['--cor' as string]: cor, width: 10 }} />}
              <span>{nome}</span>
              <strong>{valor}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
