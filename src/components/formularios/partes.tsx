'use client'

import Link from 'next/link'
import { useState, type ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import { Icone } from '@/components/ui/Icone'
import { CAMPO_ARMADILHA, mascararTelefone, type EstadoFormulario } from '@/lib/formularios'
import s from './formularios.module.css'

/** Campo invisível que só robôs preenchem. */
export function Armadilha() {
  return (
    <div className={s.armadilha} aria-hidden="true">
      <label>
        Não preencha este campo
        <input type="text" name={CAMPO_ARMADILHA} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}

export function Erro({ estado, campo }: { estado: EstadoFormulario; campo: string }) {
  const msg = estado.erros?.[campo]
  return msg ? (
    <span className="erro-campo" id={`erro-${campo}`}>
      {msg}
    </span>
  ) : null
}

function propsDeErro(estado: EstadoFormulario, campo: string) {
  const erro = estado.erros?.[campo]
  return erro ? { 'aria-invalid': true as const, 'aria-describedby': `erro-${campo}` } : {}
}

export function Campo({
  rotulo,
  opcional,
  estado,
  name,
  multilinha,
  ...props
}: {
  rotulo: string
  opcional?: boolean
  estado: EstadoFormulario
  name: string
  multilinha?: boolean
} & ComponentProps<'input'> &
  Pick<ComponentProps<'textarea'>, 'rows'>) {
  const valor = estado.valores?.[name]
  const comuns = { name, className: 'campo', defaultValue: valor, ...propsDeErro(estado, name) }
  return (
    <label className="rotulo">
      <span>
        {rotulo} {opcional && <span className="rotulo-opcional">(opcional)</span>}
      </span>
      {multilinha ? (
        <textarea {...comuns} rows={props.rows ?? 3} placeholder={props.placeholder} maxLength={2000} />
      ) : (
        <input {...comuns} {...props} />
      )}
      <Erro estado={estado} campo={name} />
    </label>
  )
}

export function CampoTelefone({ estado, rotulo = 'WhatsApp' }: { estado: EstadoFormulario; rotulo?: string }) {
  const [valor, setValor] = useState(estado.valores?.whatsapp ?? '')
  return (
    <label className="rotulo">
      {rotulo}
      <input
        className="campo"
        type="tel"
        name="whatsapp"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(81) 9 0000-0000"
        required
        value={valor}
        onChange={(e) => setValor(mascararTelefone(e.target.value))}
        {...propsDeErro(estado, 'whatsapp')}
      />
      <Erro estado={estado} campo="whatsapp" />
    </label>
  )
}

export function Consentimento({ estado }: { estado: EstadoFormulario }) {
  return (
    <div>
      <label className="consentimento">
        <input type="checkbox" name="consentimento" required defaultChecked={estado.valores?.consentimento === 'on'} />
        <span>
          Autorizo a A3 a entrar em contato e concordo com a{' '}
          <Link href="/politica-de-privacidade" style={{ fontWeight: 600 }}>
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      <Erro estado={estado} campo="consentimento" />
    </div>
  )
}

export function BotaoEnviar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`btn btn-quadrado btn-g ${className ?? 'btn-mar'}`} disabled={pending} aria-busy={pending}>
      {pending ? 'Enviando…' : children}
    </button>
  )
}

export function MensagemErroGeral({ estado }: { estado: EstadoFormulario }) {
  if (estado.status !== 'erro' || !estado.mensagem) return null
  return (
    <p role="alert" className={s.erroGeral}>
      {estado.mensagem}
    </p>
  )
}

export function Sucesso({
  titulo,
  children,
  acao,
  aoRefazer,
}: {
  titulo: string
  children?: React.ReactNode
  acao: string
  aoRefazer: () => void
}) {
  return (
    <div className={s.sucesso} role="status">
      <span className={s.sucessoIcone}>
        <Icone nome="check" tamanho={28} espessura={2.4} />
      </span>
      <h3>{titulo}</h3>
      {children}
      <button type="button" className="link-texto" onClick={aoRefazer}>
        {acao}
      </button>
    </div>
  )
}
