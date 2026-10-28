'use client'

// Confirmação de ações destrutivas: folha que sobe da base no celular, janela central no computador.
// Usa <dialog> nativo (foco preso, Esc fecha, fundo inerte).
import { useEffect, useRef, type ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import s from './Admin.module.css'

/** Campo de texto no cartão, para ações que pedem um dado (ex.: o nome de uma construtora nova). */
export interface CampoConfirmacao {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  placeholder?: string
  maxLength?: number
  /** Quantos caracteres o campo precisa ter para liberar o botão. */
  minimo?: number
}

export interface PedidoConfirmacao {
  titulo: string
  texto: ReactNode
  rotulo: string
  icone?: NomeIcone
  /** Falso: ação que não apaga nada (ícone e botão na cor principal em vez de vermelho). */
  destrutivo?: boolean
  campo?: CampoConfirmacao
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

  const liberado = !pedido?.campo || pedido.campo.valor.trim().length >= (pedido.campo.minimo ?? 1)
  const confirmar = () => {
    pedido?.aoConfirmar()
    aoFechar()
  }

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
          <span className={s.confirmacaoIcone} data-neutro={pedido.destrutivo === false || undefined}>
            <Icone nome={pedido.icone ?? 'lixeira'} tamanho={22} />
          </span>
          <h2 id="confirmacao-titulo">{pedido.titulo}</h2>
          <p>{pedido.texto}</p>
          {pedido.campo && (
            <label className={s.confirmacaoCampo}>
              <span>{pedido.campo.rotulo}</span>
              <input
                className="campo"
                value={pedido.campo.valor}
                placeholder={pedido.campo.placeholder}
                maxLength={pedido.campo.maxLength}
                onChange={(e) => pedido.campo!.aoMudar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && liberado) {
                    e.preventDefault()
                    confirmar()
                  }
                }}
                autoFocus
              />
            </label>
          )}
          <button
            type="button"
            className={`${s.botao} ${pedido.destrutivo === false ? s.botaoMar : s.botaoPerigoCheio} ${s.botaoG}`}
            disabled={!liberado}
            onClick={confirmar}
          >
            {pedido.rotulo}
          </button>
          <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} onClick={aoFechar} autoFocus={!pedido.campo}>
            Cancelar
          </button>
        </div>
      )}
    </dialog>
  )
}
