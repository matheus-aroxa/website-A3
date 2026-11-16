'use client'

// Formulários da área internacional, com a marcação e o CSS dos formulários em português (components/formularios).
// Diferenças: os textos vêm no idioma, o WhatsApp é internacional (sem a máscara de telefone brasileiro) e há o campo
// País. As partes daqui também montam as abas de contato da ficha (ContatoImovelInternacional).

import Link from 'next/link'
import { useActionState, useEffect, useState, type ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import { enviarContatoInternacional } from '@/app/acoes-internacionais'
import { Armadilha, Erro, Sucesso } from '@/components/formularios/partes'
import f from '@/components/formularios/formularios.module.css'
import { Icone } from '@/components/ui/Icone'
import { ESTADO_INICIAL, type EstadoFormulario } from '@/lib/formularios'
import type { Dicionario } from '@/lib/internacional/dicionario'
import { ehIdioma, urlSecao } from '@/lib/internacional/idiomas'

export type TextosFormulario = Dicionario['contato']

function propsDeErro(estado: EstadoFormulario, campo: string) {
  return estado.erros?.[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `erro-${campo}` } : {}
}

export function CampoTexto({
  rotulo,
  opcional,
  estado,
  name,
  multilinha,
  rows,
  ...props
}: { rotulo: string; opcional?: string; estado: EstadoFormulario; name: string; multilinha?: boolean; rows?: number } & ComponentProps<'input'>) {
  const comuns = { name, className: 'campo', defaultValue: estado.valores?.[name] ?? (props.defaultValue as string | undefined), ...propsDeErro(estado, name) }
  return (
    <label className="rotulo">
      <span>
        {rotulo} {opcional && <span className="rotulo-opcional">{opcional}</span>}
      </span>
      {multilinha ? (
        <textarea {...comuns} rows={rows ?? 3} placeholder={props.placeholder} maxLength={2000} />
      ) : (
        <input {...props} {...comuns} />
      )}
      <Erro estado={estado} campo={name} />
    </label>
  )
}

/** Nome, país e WhatsApp com o código do país: o começo de todos os formulários internacionais. */
export function CamposPessoa({ estado, t, comPais = true }: { estado: EstadoFormulario; t: TextosFormulario; comPais?: boolean }) {
  return (
    <>
      <CampoTexto rotulo={t.nome} name="nome" estado={estado} autoComplete="name" placeholder={t.nomeDica} required />
      {comPais && <CampoTexto rotulo={t.pais} opcional={t.opcional} name="pais" estado={estado} autoComplete="country-name" placeholder={t.paisDica} />}
      <CampoTexto
        rotulo={t.whatsapp}
        name="whatsapp"
        estado={estado}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder={t.whatsappDica}
        required
      />
    </>
  )
}

export function Consentimento({ estado, t, idioma }: { estado: EstadoFormulario; t: TextosFormulario; idioma: string }) {
  const politica = ehIdioma(idioma) ? urlSecao(idioma, 'privacidade') : '/politica-de-privacidade'
  return (
    <div>
      <label className="consentimento">
        <input type="checkbox" name="consentimento" required defaultChecked={estado.valores?.consentimento === 'on'} />
        <span>
          {t.consentimentoAntes}
          <Link href={politica} style={{ fontWeight: 600 }}>
            {t.consentimentoLink}
          </Link>
          {t.consentimentoDepois}
        </span>
      </label>
      <Erro estado={estado} campo="consentimento" />
    </div>
  )
}

export function Enviar({ children, enviando, className }: { children: React.ReactNode; enviando: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`btn btn-quadrado btn-g ${className ?? 'btn-mar'}`} disabled={pending} aria-busy={pending}>
      {pending ? enviando : children}
    </button>
  )
}

/** Abre o WhatsApp da A3 com a mensagem pronta, na mesma aba (não depende de permitir pop-ups). */
export function useAbrirWhatsApp(estado: EstadoFormulario) {
  const whatsapp = estado.status === 'sucesso' ? estado.whatsapp : undefined
  useEffect(() => {
    if (whatsapp) window.location.assign(whatsapp)
  }, [whatsapp])
  return whatsapp
}

export function BotaoAbrirWhatsApp({ href, rotulo }: { href?: string; rotulo: string }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener" className="btn btn-sol btn-quadrado">
      <Icone nome="whatsapp" tamanho={18} espessura={2} />
      {rotulo}
    </a>
  )
}

function Formulario({ idioma, t, aoRefazer }: { idioma: string; t: TextosFormulario; aoRefazer: () => void }) {
  const [estado, acao] = useActionState(enviarContatoInternacional, ESTADO_INICIAL)
  const whatsapp = useAbrirWhatsApp(estado)

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo={t.sucessoTitulo} acao={t.refazer} aoRefazer={aoRefazer}>
        <p>{t.sucessoTexto}</p>
        <BotaoAbrirWhatsApp href={whatsapp} rotulo={t.abrirWhatsApp} />
      </Sucesso>
    )

  return (
    <>
      <h3 style={{ fontSize: 26, fontWeight: 800, fontStretch: '112%' }}>{t.titulo}</h3>
      <form action={acao} className={f.form} noValidate data-formulario="contato">
        <Armadilha />
        <input type="hidden" name="idioma" value={idioma} />
        <CamposPessoa estado={estado} t={t} />
        <CampoTexto rotulo={t.email} opcional={t.opcional} name="email" type="email" autoComplete="email" estado={estado} />
        <CampoTexto rotulo={t.mensagem} opcional={t.opcional} name="mensagem" multilinha rows={2} estado={estado} placeholder={t.mensagemDica} />
        <Consentimento estado={estado} t={t} idioma={idioma} />
        <Enviar className="btn-sol" enviando={t.enviando}>
          {t.enviar}
        </Enviar>
      </form>
    </>
  )
}

/** Contato da home internacional ("Quero ser atendido"): abre o WhatsApp da A3 com a mensagem pronta. */
export function FormularioInternacional({ idioma, textos }: { idioma: string; textos: TextosFormulario }) {
  // Trocar a chave remonta o formulário zerado ("Enviar outra mensagem").
  const [chave, setChave] = useState(0)
  return <Formulario key={chave} idioma={idioma} t={textos} aoRefazer={() => setChave((c) => c + 1)} />
}
