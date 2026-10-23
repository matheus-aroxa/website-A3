'use client'

// Confirmação de ações destrutivas: folha que sobe da base no celular, janela central no computador.
// Usa <dialog> nativo (foco preso, Esc fecha, fundo inerte).
import { useEffect, useRef, type ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import s from './Admin.module.css'

export interface PedidoConfirmacao {
  titulo: string
  texto: ReactNode
  rotulo: string
  icone?: NomeIcone
  aoConfirmar: () => void
}

export function Confirmacao({ pedido, aoFechar }: { pedido: PedidoConfirmacao | null; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (pedido && !dialogo.open) dialogo.showModal()
    if (!pedido && dialogo.open) dialogo.close()
  }, [pedido])

  return (
    <dialog
      ref={ref}
      className={s.confirmacao}
      aria-labelledby="confirmacao-titulo"
      onClose={aoFechar}
      // Clique no fundo (fora da caixa) cancela.
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      {pedido && (
        <div className={s.confirmacaoCaixa}>
          <span className={s.confirmacaoPuxador} aria-hidden="true" />
          <span className={s.confirmacaoIcone}>
            <Icone nome={pedido.icone ?? 'lixeira'} tamanho={22} />
          </span>
          <h2 id="confirmacao-titulo">{pedido.titulo}</h2>
          <p>{pedido.texto}</p>
          <button
            type="button"
            className={`${s.botao} ${s.botaoPerigoCheio} ${s.botaoG}`}
            onClick={() => {
              pedido.aoConfirmar()
              aoFechar()
            }}
          >
            {pedido.rotulo}
          </button>
          <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} onClick={aoFechar} autoFocus>
            Cancelar
          </button>
        </div>
      )}
    </dialog>
  )
}
