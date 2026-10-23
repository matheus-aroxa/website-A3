'use client'

import { useActionState, useEffect, useState } from 'react'
import { enviarContato } from '@/app/acoes'
import { Seletor } from '@/components/ui/Seletor'
import { ESTADO_INICIAL } from '@/lib/formularios'
import { Armadilha, BotaoEnviar, Campo, CampoTelefone, Consentimento, MensagemErroGeral, Sucesso } from './partes'
import s from './formularios.module.css'

const INTERESSES = [
  'Comprar um imóvel',
  'Alugar um imóvel',
  'Lançamentos e Minha Casa Minha Vida',
  'Simular financiamento',
  'Anunciar meu imóvel',
]

function Formulario({ aoRefazer }: { aoRefazer: () => void }) {
  const [estado, acao] = useActionState(enviarContato, ESTADO_INICIAL)
  const whatsapp = estado.status === 'sucesso' ? estado.whatsapp : undefined

  // Abre o WhatsApp da A3 com a mensagem pronta. Na mesma aba: não depende de permitir pop-ups.
  useEffect(() => {
    if (whatsapp) window.location.assign(whatsapp)
  }, [whatsapp])

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo="Recebemos seus dados!" acao="Enviar outra mensagem" aoRefazer={aoRefazer} />
    )

  return (
    <>
      <h3 style={{ fontSize: 26, fontWeight: 800, fontStretch: '112%' }}>Quero ser atendido</h3>
      <form action={acao} className={s.form} noValidate>
        <Armadilha />
        <Campo rotulo="Nome" name="nome" estado={estado} autoComplete="name" placeholder="Como podemos te chamar?" required />
        <div className={s.linha}>
          <CampoTelefone estado={estado} />
          <Campo rotulo="E-mail" name="email" type="email" estado={estado} autoComplete="email" placeholder="voce@email.com" />
        </div>
        <label className="rotulo">
          Tenho interesse em
          <Seletor
            name="interesse"
            valorInicial={estado.valores?.interesse}
            opcoes={INTERESSES.map((i) => ({ valor: i, rotulo: i }))}
          />
        </label>
        <Campo
          rotulo="Mensagem"
          opcional
          name="mensagem"
          multilinha
          rows={2}
          estado={estado}
          placeholder="Conte o bairro, o valor e quantos quartos você procura"
        />
        <Consentimento estado={estado} />
        <MensagemErroGeral estado={estado} />
        <BotaoEnviar className="btn-sol">Enviar mensagem</BotaoEnviar>
      </form>
    </>
  )
}

export function FormularioContato() {
  const [versao, setVersao] = useState(0)
  return <Formulario key={versao} aoRefazer={() => setVersao((v) => v + 1)} />
}
