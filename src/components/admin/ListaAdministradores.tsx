'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { cadastrarAdministrador, mudarAcessoAdministrador } from '@/app/admin/acoes'
import { Icone } from '@/components/ui/Icone'
import type { AdministradorPainel } from '@/lib/admin/administradores'
import { useAvisar } from './Avisos'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import s from './Admin.module.css'

// Os mesmos limites que o servidor confere (src/lib/admin/administradores.ts).
const LIMITE_NOME = 120
const LIMITE_USUARIO = 150
const SENHA_MIN = 10
const SENHA_MAX = 200

const VAZIO = { nome: '', usuario: '', senha: '' }

/** Cartão de cadastro: o mesmo visual da confirmação do painel, com três campos e o erro dentro dele. */
function NovoAdministrador({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const avisar = useAvisar()
  const [pendente, iniciar] = useTransition()
  const [dados, setDados] = useState(VAZIO)
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  const mudar = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDados({ ...dados, [campo]: e.target.value })
    setErro('')
  }
  const liberado = dados.nome.trim().length >= 2 && dados.usuario.trim().length >= 3 && dados.senha.length >= SENHA_MIN

  // Em caso de erro o cartão continua aberto, com o que foi digitado.
  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    iniciar(async () => {
      const r = await cadastrarAdministrador(dados)
      if (!r.ok) return setErro(r.erro)
      avisar(`${dados.nome.trim()} já pode entrar no painel.`)
      setDados(VAZIO)
      setVerSenha(false)
      aoFechar()
    })
  }

  return (
    <dialog
      ref={ref}
      className={s.confirmacao}
      aria-labelledby="novo-administrador-titulo"
      onClose={aoFechar}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      {aberto && (
        <form className={s.confirmacaoCaixa} onSubmit={enviar}>
          <span className={s.confirmacaoPuxador} aria-hidden="true" />
          <span className={s.confirmacaoIcone} data-neutro>
            <Icone nome="usuario" tamanho={22} />
          </span>
          <h2 id="novo-administrador-titulo">Novo administrador</h2>
          <p>Com este usuário e senha a pessoa entra no painel e cuida do catálogo, mas não cadastra outros administradores.</p>
          {erro && (
            <div className={s.alerta} role="alert">
              <Icone nome="alerta" tamanho={18} />
              <span>{erro}</span>
            </div>
          )}
          <label className={s.confirmacaoCampo}>
            <span>Nome</span>
            <input className="campo" value={dados.nome} onChange={mudar('nome')} maxLength={LIMITE_NOME} placeholder="Ex.: Ana Souza" autoComplete="off" autoFocus />
          </label>
          <label className={s.confirmacaoCampo}>
            <span>Usuário</span>
            <input
              className="campo"
              value={dados.usuario}
              onChange={mudar('usuario')}
              maxLength={LIMITE_USUARIO}
              placeholder="Ex.: ana.souza"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <label className={s.confirmacaoCampo}>
            <span>Senha de primeiro acesso</span>
            <span className={s.campoSenha}>
              <input
                className="campo"
                type={verSenha ? 'text' : 'password'}
                value={dados.senha}
                onChange={mudar('senha')}
                maxLength={SENHA_MAX}
                autoComplete="new-password"
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
            <span className={s.dica}>Pelo menos {SENHA_MIN} caracteres. Repasse à pessoa por um canal seguro.</span>
          </label>
          <button type="submit" className={`${s.botao} ${s.botaoMar} ${s.botaoG}`} disabled={!liberado || pendente}>
            {pendente ? 'Cadastrando…' : 'Cadastrar administrador'}
          </button>
          <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} onClick={aoFechar}>
            Cancelar
          </button>
        </form>
      )}
    </dialog>
  )
}

export function ListaAdministradores({ administradores }: { administradores: AdministradorPainel[] }) {
  const avisar = useAvisar()
  const [pendente, iniciar] = useTransition()
  const [novo, setNovo] = useState(false)
  const [desativando, setDesativando] = useState<AdministradorPainel | null>(null)

  const mudarAcesso = (a: AdministradorPainel, ativo: boolean) =>
    iniciar(async () => {
      const r = await mudarAcessoAdministrador(a.id, ativo)
      if (r.ok) avisar(ativo ? `${a.nome ?? a.usuario} pode entrar no painel de novo.` : `${a.nome ?? a.usuario} não tem mais acesso ao painel.`)
      else avisar(r.erro, { erro: true })
    })

  const pedido: PedidoConfirmacao | null = desativando && {
    titulo: `Desativar ${desativando.nome ?? desativando.usuario}?`,
    texto: 'O acesso ao painel acaba na hora, inclusive nos aparelhos em que a pessoa já está conectada. Dá para reativar depois.',
    rotulo: 'Desativar acesso',
    icone: 'cadeado',
    aoConfirmar: () => mudarAcesso(desativando, false),
  }

  const comAcesso = administradores.filter((a) => a.ativo).length

  return (
    <>
      <div className={s.tabelaBloco}>
        <div className={s.tabelaTopo}>
          <p className={s.contagem}>
            <strong>{comAcesso}</strong> {comAcesso === 1 ? 'administrador com acesso' : 'administradores com acesso'}
          </p>
          <button type="button" className={`${s.botao} ${s.botaoSol} ${s.tabelaNova}`} onClick={() => setNovo(true)}>
            <Icone nome="mais" tamanho={17} espessura={2.4} /> <span className={s.tabelaNovaTexto}>Novo administrador</span>
          </button>
        </div>

        <div className={s.tabelaRolagem}>
          <table className={s.tabela} aria-busy={pendente}>
            <caption className="sr-only">Administradores do painel, situação e último acesso</caption>
            <colgroup>
              <col />
              <col className={s.colunaSituacao} />
              <col className={s.colunaAcao} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Administrador</th>
                <th scope="col">Situação</th>
                <th scope="col" data-alinhar="fim">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {administradores.map((a) => (
                <tr key={a.id} data-inativo={!a.ativo || undefined}>
                  <th scope="row" className={s.tabelaNome}>
                    {a.nome ?? a.usuario}
                    <span className={s.tabelaDetalhe}>
                      {a.usuario} · {a.ultimoAcesso ? `último acesso em ${a.ultimoAcesso}` : 'ainda não entrou'}
                    </span>
                  </th>
                  <td>
                    {a.principal ? (
                      <span className={`${s.marcador} ${s.marcadorPrincipal}`}>Principal</span>
                    ) : a.ativo ? (
                      <span className={`${s.marcador} ${s.marcadorAtivo}`}>Com acesso</span>
                    ) : (
                      <span className={`${s.marcador} ${s.marcadorDesativado}`}>Desativado</span>
                    )}
                  </td>
                  <td data-alinhar="fim">
                    {!a.principal &&
                      (a.ativo ? (
                        <button
                          type="button"
                          className={`${s.botao} ${s.botaoPerigo} ${s.botaoIcone}`}
                          onClick={() => setDesativando(a)}
                          disabled={pendente}
                          aria-label={`Desativar ${a.nome ?? a.usuario}`}
                          title="Desativar acesso"
                        >
                          <Icone nome="cadeado" tamanho={17} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${s.botao} ${s.botaoLinha} ${s.botaoIcone}`}
                          onClick={() => mudarAcesso(a, true)}
                          disabled={pendente}
                          aria-label={`Reativar ${a.nome ?? a.usuario}`}
                          title="Reativar acesso"
                        >
                          <Icone nome="restaurar" tamanho={17} />
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NovoAdministrador aberto={novo} aoFechar={() => setNovo(false)} />
      <Confirmacao pedido={pedido} aoFechar={() => setDesativando(null)} />
    </>
  )
}
