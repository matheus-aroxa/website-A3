'use client'

import { useActionState, useEffect, useState } from 'react'
import { falarComCorretor, solicitarVisita } from '@/app/acoes'
import {
  Armadilha,
  BotaoEnviar,
  Campo,
  CampoTelefone,
  Consentimento,
  Erro,
  MensagemErroGeral,
  Sucesso,
} from '@/components/formularios/partes'
import { Icone } from '@/components/ui/Icone'
import { ESTADO_INICIAL } from '@/lib/formularios'
import s from './Imovel.module.css'
import f from '@/components/formularios/formularios.module.css'

type Aba = 'visita' | 'corretor'

const DIAS = [
  ['seg', 'segundas'],
  ['ter', 'terças'],
  ['qua', 'quartas'],
  ['qui', 'quintas'],
  ['sex', 'sextas'],
  ['sáb', 'sábados'],
  ['dom', 'domingos'],
] as const
const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function juntar(lista: string[], ultimoSeparador: string) {
  if (lista.length <= 1) return lista.join('')
  return `${lista.slice(0, -1).join(', ')}${ultimoSeparador}${lista[lista.length - 1]}`
}

function resumoAgenda(dias: string[], horarios: string[]) {
  const nomes = DIAS.filter(([d]) => dias.includes(d)).map(([, nome]) => nome)
  const todas = HORAS.every((h) => horarios.includes(h))
  const horas = HORAS.filter((h) => horarios.includes(h)).map((h) => `${parseInt(h, 10)}h`)
  const textoHoras = todas ? 'em qualquer horário' : `às ${juntar(horas, ' ou ')}`
  if (nomes.length && horas.length) return `Você pode às ${juntar(nomes, ' e ')}, ${textoHoras}.`
  if (nomes.length) return `Dias: ${juntar(nomes, ' e ')}. Agora escolha os horários.`
  if (horas.length) return `Horários: ${todas ? 'qualquer horário' : juntar(horas, ' ou ')}. Agora escolha os dias.`
  return 'Escolha pelo menos um dia da semana e um horário.'
}

function alternar(lista: string[], item: string) {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]
}

function FormVisita({ imovelId, aoRefazer }: { imovelId: string; aoRefazer: () => void }) {
  const [estado, acao] = useActionState(solicitarVisita, ESTADO_INICIAL)
  const [dias, setDias] = useState<string[]>([])
  const [horarios, setHorarios] = useState<string[]>([])
  const todas = HORAS.every((h) => horarios.includes(h))
  const resumo = resumoAgenda(dias, horarios)
  const whatsapp = estado.status === 'sucesso' ? estado.whatsapp : undefined

  // Abre o WhatsApp da A3 com a mensagem pronta. Na mesma aba: não depende de permitir pop-ups.
  useEffect(() => {
    if (whatsapp) window.location.assign(whatsapp)
  }, [whatsapp])

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo="Quase lá!" acao="Alterar dias e horários" aoRefazer={aoRefazer}>
        <p>{resumo}</p>
        <p>{estado.mensagem}</p>
      </Sucesso>
    )

  const botaoHora = (h: string) => (
    <button key={h} type="button" className="alternancia" aria-pressed={horarios.includes(h)} onClick={() => setHorarios(alternar(horarios, h))}>
      {h}
    </button>
  )

  return (
    <form action={acao} className={f.form} noValidate style={{ gap: 20 }}>
      <Armadilha />
      <input type="hidden" name="imovel" value={imovelId} />
      {dias.map((d) => (
        <input key={d} type="hidden" name="dias" value={d} />
      ))}
      {horarios.map((h) => (
        <input key={h} type="hidden" name="horarios" value={h} />
      ))}

      <Campo rotulo="Nome" name="nome" estado={estado} autoComplete="name" placeholder="Seu nome completo" required />
      <CampoTelefone estado={estado} />

      <fieldset className={s.agendaGrupo}>
        <legend>Quais dias você pode?</legend>
        <p>Marque os dias da semana que ficam melhor para você.</p>
        <div className={s.dias}>
          {DIAS.map(([d, nome]) => (
            <button key={d} type="button" className="alternancia" aria-pressed={dias.includes(d)} aria-label={nome} onClick={() => setDias(alternar(dias, d))}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={s.agendaGrupo}>
        <legend>E em quais horários?</legend>
        <button type="button" className="alternancia" aria-pressed={todas} onClick={() => setHorarios(todas ? [] : [...HORAS])} style={{ width: '100%' }}>
          Qualquer horário
        </button>
        <span className={s.periodo}>Manhã</span>
        <div className={s.horas}>{HORAS.slice(0, 4).map(botaoHora)}</div>
        <span className={s.periodo}>Tarde</span>
        <div className={s.horas}>{HORAS.slice(4).map(botaoHora)}</div>
      </fieldset>

      <div className={s.resumoAgenda} aria-live="polite">
        <Icone nome="calendario" />
        <span>{resumo}</span>
      </div>
      <Erro estado={estado} campo="agenda" />

      <Campo
        rotulo="Observações"
        opcional
        name="observacoes"
        multilinha
        estado={estado}
        placeholder="Ex.: prefiro visitar com minha família, tenho interesse na planta de 3 quartos…"
      />
      <Consentimento estado={estado} />
      <Erro estado={estado} campo="imovel" />
      <MensagemErroGeral estado={estado} />
      <BotaoEnviar>Solicitar visita pelo WhatsApp</BotaoEnviar>
    </form>
  )
}

function FormCorretor({
  imovelId,
  nomeImovel,
  mensagemInicial,
  aoRefazer,
}: {
  imovelId: string
  nomeImovel: string
  mensagemInicial?: string
  aoRefazer: () => void
}) {
  const [estado, acao] = useActionState(falarComCorretor, ESTADO_INICIAL)
  const canal = estado.valores?.canal ?? 'whatsapp'
  const whatsapp = estado.status === 'sucesso' ? estado.whatsapp : undefined

  // Abre o WhatsApp da A3 com a mensagem pronta. Na mesma aba: não depende de permitir pop-ups.
  useEffect(() => {
    if (whatsapp) window.location.assign(whatsapp)
  }, [whatsapp])

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo="Quase lá!" acao="Enviar outra mensagem" aoRefazer={aoRefazer}>
        <p>{estado.mensagem}</p>
      </Sucesso>
    )

  return (
    <form action={acao} className={f.form} noValidate>
      <Armadilha />
      <input type="hidden" name="imovel" value={imovelId} />
      <Campo rotulo="Nome" name="nome" estado={estado} autoComplete="name" placeholder="Seu nome completo" required />
      <CampoTelefone estado={estado} />
      <label className="rotulo">
        Mensagem
        <textarea
          className="campo"
          name="mensagem"
          rows={4}
          maxLength={2000}
          defaultValue={estado.valores?.mensagem ?? mensagemInicial}
          placeholder={`Olá! Tenho interesse no ${nomeImovel} e gostaria de mais informações.`}
        />
      </label>
      <fieldset className={s.agendaGrupo}>
        <legend className={s.legendaSuave}>Prefiro ser contatado por</legend>
        <div className={s.canais}>
          {(
            [
              ['whatsapp', 'WhatsApp'],
              ['ligacao', 'Ligação'],
            ] as const
          ).map(([valor, rotulo]) => (
            <label key={valor}>
              <input type="radio" name="canal" value={valor} defaultChecked={canal === valor} />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>
      <Consentimento estado={estado} />
      <Erro estado={estado} campo="imovel" />
      <MensagemErroGeral estado={estado} />
      <BotaoEnviar>Enviar pelo WhatsApp</BotaoEnviar>
    </form>
  )
}

/**
 * Abas "Agendar visita" / "Falar com corretor". Links com #agendar-visita,
 * #falar-com-corretor ou #simular-parcelas (barra do celular, card de preço) trocam a aba.
 */
export function ContatoImovel({ imovelId, nomeImovel }: { imovelId: string; nomeImovel: string }) {
  const [aba, setAba] = useState<Aba>('visita')
  const [mensagemInicial, setMensagemInicial] = useState<string>()
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    function lerHash() {
      const hash = window.location.hash
      if (hash === '#agendar-visita') setAba('visita')
      if (hash === '#falar-com-corretor') setAba('corretor')
      if (hash === '#simular-parcelas') {
        setAba('corretor')
        setMensagemInicial(`Olá! Gostaria de simular as parcelas do ${nomeImovel}.`)
        setVersao((v) => v + 1)
      }
    }
    lerHash()
    window.addEventListener('hashchange', lerHash)
    return () => window.removeEventListener('hashchange', lerHash)
  }, [nomeImovel])

  const refazer = () => setVersao((v) => v + 1)

  return (
    <div className={s.cartaoContato}>
      <span id="agendar-visita" className={s.ancora} />
      <span id="falar-com-corretor" className={s.ancora} />
      <span id="simular-parcelas" className={s.ancora} />
      <div className="segmentado" role="tablist" aria-label="Como prefere falar com a A3">
        {(
          [
            ['visita', 'Agendar visita'],
            ['corretor', 'Falar com corretor'],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`aba-${id}`}
            aria-selected={aba === id}
            aria-controls={`painel-${id}`}
            onClick={() => setAba(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'visita' ? (
          <FormVisita key={`v${versao}`} imovelId={imovelId} aoRefazer={refazer} />
        ) : (
          <FormCorretor key={`c${versao}`} imovelId={imovelId} nomeImovel={nomeImovel} mensagemInicial={mensagemInicial} aoRefazer={refazer} />
        )}
      </div>
    </div>
  )
}
