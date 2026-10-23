'use client'

import { useSearchParams } from 'next/navigation'
import { useActionState, useState } from 'react'
import { entrar } from '@/app/admin/acoes'
import { Icone } from '@/components/ui/Icone'
import { ESTADO_INICIAL } from '@/lib/formularios'
import s from './Admin.module.css'

/** `de`: página do painel para onde voltar depois de entrar. */
export function FormularioLogin({ de = '' }: { de?: string }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL)
  const [verSenha, setVerSenha] = useState(false)
  const [faltando, setFaltando] = useState(false)
  const mensagem = faltando ? 'Preencha o usuário e a senha para entrar.' : estado.mensagem

  return (
    <>
      {/* Como no protótipo, o aviso fica entre o título do cartão e o formulário. */}
      {mensagem && (
        <div className={s.alerta} role="alert">
          <Icone nome="alerta" tamanho={18} />
          <span>{mensagem}</span>
        </div>
      )}
      <form
        action={acao}
        className={s.loginFormulario}
        noValidate
        onSubmit={(e) => {
          // Campos vazios: avisa aqui mesmo, sem gastar uma tentativa no servidor.
          const dados = new FormData(e.currentTarget)
          if (!String(dados.get('email') ?? '').trim() || !dados.get('senha')) {
            e.preventDefault()
            setFaltando(true)
          }
        }}
        onInput={() => faltando && setFaltando(false)}
      >
        <input type="hidden" name="de" value={de} />

        <label className={s.rotulo}>
          Usuário
          <span className={s.campoIcone}>
            <Icone nome="usuario" />
            <input
              className="campo"
              type="text"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="seu.usuario"
              defaultValue={estado.valores?.email}
            />
          </span>
        </label>

        <label className={s.rotulo}>
          Senha
          <span className={s.campoIcone}>
            <Icone nome="cadeado" />
            <input
              className="campo"
              type={verSenha ? 'text' : 'password'}
              name="senha"
              autoComplete="current-password"
              placeholder="••••••••"
              data-com-botao
            />
            <button
              type="button"
              className={s.verSenha}
              onClick={() => setVerSenha(!verSenha)}
              aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
              aria-pressed={verSenha}
            >
              <Icone nome={verSenha ? 'olho-fechado' : 'olho'} />
            </button>
          </span>
        </label>

        <label className={s.lembrar}>
          <input type="checkbox" className="caixa" name="lembrar" />
          <span>
            Manter conectado<span className={s.soComputador}> neste computador</span>
          </span>
        </label>

        <button type="submit" className={`${s.botao} ${s.botaoMar} ${s.botaoEntrar}`} disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
          {!enviando && <Icone nome="seta" tamanho={18} espessura={2} />}
        </button>
      </form>
    </>
  )
}

/** Lê o destino da URL (?de=/admin/...). Fica atrás de um Suspense na página. */
export function FormularioLoginComDestino() {
  return <FormularioLogin de={useSearchParams().get('de') ?? ''} />
}
