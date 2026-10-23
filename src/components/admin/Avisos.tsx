'use client'

// Aviso flutuante do painel ("Alterações publicadas", "Foi desativado… Desfazer").
// Fica no layout, então continua visível quando a ação muda de página.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import s from './Admin.module.css'

interface Aviso {
  id: number
  texto: string
  erro?: boolean
  desfazer?: () => void
}

type Avisar = (texto: string, opcoes?: { erro?: boolean; desfazer?: () => void }) => void

const Contexto = createContext<Avisar>(() => {})

export const useAvisar = () => useContext(Contexto)

export function Avisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const avisar = useCallback<Avisar>((texto, opcoes) => setAviso({ id: Date.now(), texto, ...opcoes }), [])

  useEffect(() => {
    if (!aviso) return
    // Com "Desfazer", fica mais tempo na tela.
    const t = setTimeout(() => setAviso(null), aviso.desfazer ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [aviso])

  return (
    <Contexto value={avisar}>
      {children}
      <div className={s.avisoRegiao} role="status" aria-live="polite">
        {aviso && (
          <div key={aviso.id} className={s.aviso} data-erro={aviso.erro || undefined}>
            <span className={s.avisoIcone}>
              <Icone nome={aviso.erro ? 'fechar' : 'check'} tamanho={15} espessura={2.6} />
            </span>
            <span className={s.avisoTexto}>{aviso.texto}</span>
            {aviso.desfazer && (
              <button
                type="button"
                className={s.avisoDesfazer}
                onClick={() => {
                  setAviso(null)
                  aviso.desfazer?.()
                }}
              >
                Desfazer
              </button>
            )}
            <button type="button" className={s.avisoFechar} onClick={() => setAviso(null)} aria-label="Fechar aviso">
              <Icone nome="fechar" tamanho={16} espessura={2} />
            </button>
          </div>
        )}
      </div>
    </Contexto>
  )
}
