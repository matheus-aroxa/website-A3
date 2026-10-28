'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { cadastrarAdministrador, editarDadosAdministrador, excluirAdministradorAcao } from '@/app/admin/acoes'
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
const POR_PAGINA = 20

const rotulo = (a: AdministradorPainel) => a.nome ?? a.usuario

/** Cabeçalho que ordena os nomes ao clicar; o principal fica sempre no topo. */
function CabecalhoNome({ decrescente, aoOrdenar }: { decrescente: boolean; aoOrdenar: () => void }) {
  return (
    <th scope="col" aria-sort={decrescente ? 'descending' : 'ascending'}>
      <button type="button" className={s.tabelaOrdenar} data-ativa onClick={aoOrdenar}>
        Administrador
        <span className={s.tabelaSeta} data-cima={!decrescente || undefined} aria-hidden="true">
          <Icone nome="chevron-baixo" tamanho={15} espessura={2.4} />
        </span>
      </button>
    </th>
  )
}

/**
 * Cartão de cadastro e de edição: o mesmo visual da confirmação do painel, com três campos e o erro dentro dele.
 * `editando`: o administrador que está sendo editado; sem ele, é um cadastro novo.
 */
function FormularioAdministrador({ aberto, editando, aoFechar }: { aberto: boolean; editando: AdministradorPainel | null; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const avisar = useAvisar()
  const [pendente, iniciar] = useTransition()
  const [dados, setDados] = useState(VAZIO)
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) {
      // Na edição o cartão abre com os dados atuais (a senha nunca: vazia mantém a atual).
      setDados(editando ? { nome: editando.nome ?? '', usuario: editando.usuario, senha: '' } : VAZIO)
      setVerSenha(false)
      setErro('')
      dialogo.showModal()
    }
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto, editando])

  const mudar = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDados({ ...dados, [campo]: e.target.value })
    setErro('')
  }
  const senhaOk = editando ? dados.senha === '' || dados.senha.length >= SENHA_MIN : dados.senha.length >= SENHA_MIN
  const liberado = dados.nome.trim().length >= 2 && dados.usuario.trim().length >= 3 && senhaOk

  // Em caso de erro o cartão continua aberto, com o que foi digitado.
  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    iniciar(async () => {
      const r = editando ? await editarDadosAdministrador(editando.id, dados) : await cadastrarAdministrador(dados)
      if (!r.ok) return setErro(r.erro)
      avisar(editando ? `Dados de ${dados.nome.trim()} atualizados.` : `${dados.nome.trim()} já pode entrar no painel.`)
      aoFechar()
    })
  }

  return (
    <dialog
      ref={ref}
      className={s.confirmacao}
      aria-labelledby="formulario-administrador-titulo"
      onClose={aoFechar}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      {aberto && (
        <form className={s.confirmacaoCaixa} onSubmit={enviar}>
          <span className={s.confirmacaoPuxador} aria-hidden="true" />
          <span className={s.confirmacaoIcone} data-neutro>
            <Icone nome={editando ? 'editar' : 'usuario'} tamanho={22} />
          </span>
          <h2 id="formulario-administrador-titulo">{editando ? `Editar ${editando.nome ?? editando.usuario}` : 'Novo administrador'}</h2>
          <p>
            {editando
              ? editando.principal
                ? 'Uma senha nova encerra o acesso nos seus outros aparelhos. Neste você continua conectado.'
                : 'Uma senha nova encerra o acesso nos aparelhos em que a pessoa já está conectada: ela entra de novo com a senha nova.'
              : 'Com este usuário e senha a pessoa entra no painel e cuida do catálogo, mas não cadastra outros administradores.'}
          </p>
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
            <span>{editando ? 'Nova senha' : 'Senha de primeiro acesso'}</span>
            <span className={s.campoSenha}>
              <input
                className="campo"
                type={verSenha ? 'text' : 'password'}
                value={dados.senha}
                onChange={mudar('senha')}
                maxLength={SENHA_MAX}
                autoComplete="new-password"
                placeholder={editando ? 'Deixe em branco para manter a atual' : undefined}
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
            {editando ? (pendente ? 'Salvando…' : 'Salvar alterações') : pendente ? 'Cadastrando…' : 'Cadastrar administrador'}
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
  // `null` com o cartão aberto é um cadastro novo.
  const [formulario, setFormulario] = useState<{ editando: AdministradorPainel | null } | null>(null)
  const [excluindo, setExcluindo] = useState<AdministradorPainel | null>(null)
  const [pagina, setPagina] = useState(1)
  const [decrescente, setDecrescente] = useState(false)

  const excluir = (a: AdministradorPainel) =>
    iniciar(async () => {
      const r = await excluirAdministradorAcao(a.id)
      if (r.ok) avisar(`${rotulo(a)} foi excluído e não entra mais no painel.`)
      else avisar(r.erro, { erro: true })
    })

  const pedido: PedidoConfirmacao | null = excluindo && {
    titulo: `Excluir ${rotulo(excluindo)}?`,
    texto: 'O administrador é apagado de vez e o acesso acaba na hora, inclusive nos aparelhos em que a pessoa já está conectada. Não dá para desfazer.',
    rotulo: 'Excluir administrador',
    aoConfirmar: () => excluir(excluindo),
  }

  const linhas = useMemo(
    () =>
      [...administradores].sort(
        (a, b) => Number(b.principal) - Number(a.principal) || (decrescente ? -1 : 1) * rotulo(a).localeCompare(rotulo(b), 'pt-BR'),
      ),
    [administradores, decrescente],
  )

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  const visiveis = linhas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA)

  return (
    <>
      <div className={s.novoAdministrador}>
        <button type="button" className={`${s.botao} ${s.botaoSol}`} onClick={() => setFormulario({ editando: null })}>
          <Icone nome="mais" tamanho={17} espessura={2.4} /> Novo administrador
        </button>
      </div>

      <div className={s.tabelaBloco}>
        <div className={s.tabelaRolagem}>
          <table className={`${s.tabela} ${s.tabelaAdministradores}`} aria-busy={pendente}>
            <caption className="sr-only">Administradores do painel</caption>
            <colgroup>
              <col />
              <col className={s.colunaAcoes} />
            </colgroup>
            <thead>
              <tr>
                <CabecalhoNome
                  decrescente={decrescente}
                  aoOrdenar={() => {
                    setDecrescente(!decrescente)
                    setPagina(1)
                  }}
                />
                <th scope="col" data-alinhar="fim">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((a) => (
                <tr key={a.id}>
                  <th scope="row" className={s.tabelaNome}>
                    <span className={s.nomeAdministrador}>
                      <span className={s.nomeAdministradorTexto}>{rotulo(a)}</span>
                      {a.principal && <span className={`${s.marcador} ${s.marcadorPrincipal}`}>Principal</span>}
                    </span>
                  </th>
                  <td data-alinhar="fim">
                    <div className={s.tabelaAcoes}>
                      <button
                        type="button"
                        className={`${s.botao} ${s.botaoLinha} ${s.botaoIcone}`}
                        onClick={() => setFormulario({ editando: a })}
                        disabled={pendente}
                        aria-label={`Editar ${rotulo(a)}`}
                        title="Editar nome, usuário ou senha"
                      >
                        <Icone nome="editar" tamanho={16} />
                      </button>
                      {!a.principal && (
                        <button
                          type="button"
                          className={`${s.botao} ${s.botaoPerigo} ${s.botaoIcone}`}
                          onClick={() => setExcluindo(a)}
                          disabled={pendente}
                          aria-label={`Excluir ${rotulo(a)}`}
                          title="Excluir"
                        >
                          <Icone nome="lixeira" tamanho={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <nav className={s.paginar} aria-label="Páginas">
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {atual > 1 && (
              <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG} ${s.paginarBotao}`} onClick={() => setPagina(atual - 1)}>
                Anterior
              </button>
            )}
            {atual < totalPaginas && (
              <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG} ${s.paginarBotao}`} onClick={() => setPagina(atual + 1)}>
                Próxima
              </button>
            )}
          </div>
          <p>
            Página {atual} de {totalPaginas}
          </p>
        </nav>
      )}

      <FormularioAdministrador aberto={formulario !== null} editando={formulario?.editando ?? null} aoFechar={() => setFormulario(null)} />
      <Confirmacao pedido={pedido} aoFechar={() => setExcluindo(null)} />
    </>
  )
}
