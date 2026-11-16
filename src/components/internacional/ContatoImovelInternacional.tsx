'use client'

// As abas "Agendar visita" / "Falar com corretor" da ficha (components/imovel/ContatoImovel), com os textos no idioma,
// WhatsApp internacional e a visita que pode ser presencial ou por vídeo. Mesma marcação e mesmo CSS.

import { useActionState, useEffect, useState } from 'react'
import { falarComCorretorInternacional, solicitarVisitaInternacional } from '@/app/acoes-internacionais'
import { Armadilha, Erro, Sucesso } from '@/components/formularios/partes'
import f from '@/components/formularios/formularios.module.css'
import s from '@/components/imovel/Imovel.module.css'
import { Icone } from '@/components/ui/Icone'
import { ESTADO_INICIAL } from '@/lib/formularios'
import type { Dicionario } from '@/lib/internacional/dicionario'
import { BotaoAbrirWhatsApp, CampoTexto, CamposPessoa, Consentimento, Enviar, useAbrirWhatsApp, type TextosFormulario } from './FormularioInternacional'

type TextosVisita = Dicionario['visita']
type Aba = 'visita' | 'corretor'

/** Chaves dos dias (as mesmas do formulário em português, que a ação lê). */
const CHAVES_DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function juntar(lista: string[], e: string) {
  if (lista.length <= 1) return lista.join('')
  return `${lista.slice(0, -1).join(', ')} ${e} ${lista[lista.length - 1]}`
}

function resumoAgenda(dias: string[], horarios: string[], v: TextosVisita) {
  const nomes = CHAVES_DIAS.flatMap((chave, i) => (dias.includes(chave) ? [v.dias[i]![1]] : []))
  const todas = HORAS.every((h) => horarios.includes(h))
  const horas = HORAS.filter((h) => horarios.includes(h)).map((h) => v.hora.replace('{h}', String(parseInt(h, 10))))
  const textoHoras = todas ? v.emQualquerHorario : v.horasAs.replace('{horas}', juntar(horas, v.e))
  if (nomes.length && horas.length) return v.resumo.replace('{dias}', juntar(nomes, v.e)).replace('{horas}', textoHoras)
  if (nomes.length) return v.resumoDias.replace('{dias}', juntar(nomes, v.e))
  if (horas.length) return v.resumoHoras.replace('{horas}', todas ? v.qualquerHorario.toLowerCase() : juntar(horas, v.e))
  return v.resumoVazio
}

const alternar = (lista: string[], item: string) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item])

function FormVisita({ idioma, imovelId, t, v, aoRefazer }: { idioma: string; imovelId: string; t: TextosFormulario; v: TextosVisita; aoRefazer: () => void }) {
  const [estado, acao] = useActionState(solicitarVisitaInternacional, ESTADO_INICIAL)
  const [dias, setDias] = useState<string[]>([])
  const [horarios, setHorarios] = useState<string[]>([])
  const todas = HORAS.every((h) => horarios.includes(h))
  const resumo = resumoAgenda(dias, horarios, v)
  const whatsapp = useAbrirWhatsApp(estado)

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo={v.quaseLa} acao={v.alterarAgenda} aoRefazer={aoRefazer}>
        <p>{resumo}</p>
        <p>{t.sucessoTexto}</p>
        <BotaoAbrirWhatsApp href={whatsapp} rotulo={t.abrirWhatsApp} />
      </Sucesso>
    )

  const botaoHora = (h: string) => (
    <button key={h} type="button" className="alternancia" aria-pressed={horarios.includes(h)} onClick={() => setHorarios(alternar(horarios, h))}>
      {h}
    </button>
  )

  return (
    <form action={acao} className={f.form} noValidate style={{ gap: 20 }} data-formulario="visita">
      <Armadilha />
      <input type="hidden" name="idioma" value={idioma} />
      <input type="hidden" name="imovel" value={imovelId} />
      {dias.map((d) => (
        <input key={d} type="hidden" name="dias" value={d} />
      ))}
      {horarios.map((h) => (
        <input key={h} type="hidden" name="horarios" value={h} />
      ))}

      <CamposPessoa estado={estado} t={t} comPais={false} />

      <fieldset className={s.agendaGrupo}>
        <legend>{v.diasTitulo}</legend>
        <p>{v.diasTexto}</p>
        <div className={s.dias}>
          {CHAVES_DIAS.map((chave, i) => (
            <button
              key={chave}
              type="button"
              className="alternancia"
              aria-pressed={dias.includes(chave)}
              aria-label={v.dias[i]![1]}
              onClick={() => setDias(alternar(dias, chave))}
            >
              {v.dias[i]![0]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={s.agendaGrupo}>
        <legend>{v.horasTitulo}</legend>
        <button type="button" className="alternancia" aria-pressed={todas} onClick={() => setHorarios(todas ? [] : [...HORAS])} style={{ width: '100%' }}>
          {v.qualquerHorario}
        </button>
        <span className={s.periodo}>{v.manha}</span>
        <div className={s.horas}>{HORAS.slice(0, 4).map(botaoHora)}</div>
        <span className={s.periodo}>{v.tarde}</span>
        <div className={s.horas}>{HORAS.slice(4).map(botaoHora)}</div>
      </fieldset>

      <div className={s.resumoAgenda} aria-live="polite">
        <Icone nome="calendario" />
        <span>{resumo}</span>
      </div>
      <Erro estado={estado} campo="agenda" />

      <CampoTexto rotulo={v.observacoes} opcional={t.opcional} name="observacoes" multilinha estado={estado} placeholder={v.observacoesDica} />
      <Consentimento estado={estado} t={t} idioma={idioma} />
      <Erro estado={estado} campo="imovel" />
      <Enviar enviando={t.enviando}>{v.enviarVisita}</Enviar>
    </form>
  )
}

function FormCorretor({
  idioma,
  imovelId,
  nomeImovel,
  mensagemInicial,
  t,
  v,
  aoRefazer,
}: {
  idioma: string
  imovelId: string
  nomeImovel: string
  mensagemInicial?: string
  t: TextosFormulario
  v: TextosVisita
  aoRefazer: () => void
}) {
  const [estado, acao] = useActionState(falarComCorretorInternacional, ESTADO_INICIAL)
  const canal = estado.valores?.canal ?? 'whatsapp'
  const whatsapp = useAbrirWhatsApp(estado)

  if (estado.status === 'sucesso')
    return (
      <Sucesso titulo={v.quaseLa} acao={t.refazer} aoRefazer={aoRefazer}>
        <p>{t.sucessoTexto}</p>
        <BotaoAbrirWhatsApp href={whatsapp} rotulo={t.abrirWhatsApp} />
      </Sucesso>
    )

  return (
    <form action={acao} className={f.form} noValidate data-formulario="corretor">
      <Armadilha />
      <input type="hidden" name="idioma" value={idioma} />
      <input type="hidden" name="imovel" value={imovelId} />
      <CamposPessoa estado={estado} t={t} />
      <label className="rotulo">
        {v.mensagem}
        <textarea
          className="campo"
          name="mensagem"
          rows={4}
          maxLength={2000}
          defaultValue={estado.valores?.mensagem ?? mensagemInicial}
          placeholder={v.mensagemDica.replace('{nome}', nomeImovel)}
        />
      </label>
      <fieldset className={s.agendaGrupo}>
        <legend className={s.legendaSuave}>{v.contatoPor}</legend>
        <div className={s.canais}>
          {(
            [
              ['whatsapp', 'WhatsApp'],
              ['ligacao', v.ligacao],
            ] as const
          ).map(([valor, rotulo]) => (
            <label key={valor}>
              <input type="radio" name="canal" value={valor} defaultChecked={canal === valor} />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>
      <Consentimento estado={estado} t={t} idioma={idioma} />
      <Erro estado={estado} campo="imovel" />
      <Enviar enviando={t.enviando}>{v.enviarCorretor}</Enviar>
    </form>
  )
}

/**
 * Links com #agendar-visita, #falar-com-corretor ou #simular-parcelas (barra do celular, card de preço) trocam a aba,
 * como na ficha em português.
 */
export function ContatoImovelInternacional({
  idioma,
  imovelId,
  nomeImovel,
  mensagemParcelas,
  contato,
  visita,
}: {
  idioma: string
  imovelId: string
  nomeImovel: string
  /** Mensagem já pronta do "Simular parcelas". */
  mensagemParcelas: string
  contato: TextosFormulario
  visita: TextosVisita
}) {
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
        setMensagemInicial(mensagemParcelas)
        setVersao((n) => n + 1)
      }
    }
    lerHash()
    window.addEventListener('hashchange', lerHash)
    return () => window.removeEventListener('hashchange', lerHash)
  }, [mensagemParcelas])

  const refazer = () => setVersao((n) => n + 1)

  return (
    <div className={s.cartaoContato}>
      <span id="agendar-visita" className={s.ancora} />
      <span id="falar-com-corretor" className={s.ancora} />
      <span id="simular-parcelas" className={s.ancora} />
      <div className="segmentado" role="tablist" aria-label={visita.abasRotulo}>
        {(
          [
            ['visita', visita.abaVisita],
            ['corretor', visita.abaCorretor],
          ] as const
        ).map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" id={`aba-${id}`} aria-selected={aba === id} aria-controls={`painel-${id}`} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'visita' ? (
          <FormVisita key={`v${versao}`} idioma={idioma} imovelId={imovelId} t={contato} v={visita} aoRefazer={refazer} />
        ) : (
          <FormCorretor
            key={`c${versao}`}
            idioma={idioma}
            imovelId={imovelId}
            nomeImovel={nomeImovel}
            mensagemInicial={mensagemInicial}
            t={contato}
            v={visita}
            aoRefazer={refazer}
          />
        )}
      </div>
    </div>
  )
}
