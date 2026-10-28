'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { cadastrarConstrutora, excluirConstrutoraAcao, renomearConstrutoraAcao } from '@/app/admin/acoes'
import { Icone } from '@/components/ui/Icone'
import type { ConstrutoraAdmin } from '@/lib/imoveis/construtoras'
import { normalizarBusca } from '@/lib/imoveis/formato'
import { useAvisar } from './Avisos'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import s from './Admin.module.css'

const LIMITE_NOME = 120
const POR_PAGINA = 20

type Coluna = 'nome' | 'imoveis'
/** Critérios de ordenação, o primeiro com mais peso; os seguintes desempatam. */
type Criterio = { coluna: Coluna; decrescente: boolean }

const porNome = (a: ConstrutoraAdmin, b: ConstrutoraAdmin) => a.nome.localeCompare(b.nome, 'pt-BR')

/**
 * Clicar numa coluna que não é a principal a torna a principal (os outros critérios continuam desempatando).
 * Clicar na principal alterna crescente, decrescente e sem ordenação nela. Sem nenhum critério, vale o nome.
 */
function ordenarPor(criterios: Criterio[], coluna: Coluna): Criterio[] {
  const atual = criterios.find((c) => c.coluna === coluna)
  const resto = criterios.filter((c) => c.coluna !== coluna)
  if (!atual) return [{ coluna, decrescente: coluna === 'imoveis' }, ...resto]
  if (criterios[0] !== atual) return [atual, ...resto]
  return atual.decrescente === (coluna === 'imoveis') ? [{ ...atual, decrescente: !atual.decrescente }, ...resto] : resto
}

/** Cabeçalho que ordena ao clicar; a seta mostra a direção da coluna que está na ordenação. */
function Cabecalho({
  coluna,
  criterios,
  aoOrdenar,
  children,
}: {
  coluna: Coluna
  criterios: Criterio[]
  aoOrdenar: (c: Coluna) => void
  children: string
}) {
  const posicao = criterios.findIndex((c) => c.coluna === coluna)
  const criterio = criterios[posicao]
  const principal = posicao === 0
  return (
    <th scope="col" aria-sort={principal ? (criterio!.decrescente ? 'descending' : 'ascending') : 'none'} data-alinhar={coluna === 'imoveis' ? 'centro' : undefined}>
      <button type="button" className={s.tabelaOrdenar} data-ativa={criterio ? true : undefined} onClick={() => aoOrdenar(coluna)}>
        {children}
        <span className={s.tabelaSeta} data-cima={(criterio && !criterio.decrescente) || undefined} aria-hidden="true">
          <Icone nome="chevron-baixo" tamanho={15} espessura={2.4} />
        </span>
      </button>
    </th>
  )
}

export function ListaConstrutoras({ construtoras }: { construtoras: ConstrutoraAdmin[] }) {
  const avisar = useAvisar()
  const [pendente, iniciar] = useTransition()
  const [novo, setNovo] = useState('')
  const [acao, setAcao] = useState<'criar' | ConstrutoraAdmin | null>(null)
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [criterios, setCriterios] = useState<Criterio[]>([{ coluna: 'nome', decrescente: false }])
  const [editando, setEditando] = useState<{ id: number; nome: string } | null>(null)

  const executar = (trabalho: () => ReturnType<typeof cadastrarConstrutora>, sucesso: string, aoConcluir: () => void) =>
    iniciar(async () => {
      const r = await trabalho()
      if (r.ok) {
        aoConcluir()
        avisar(sucesso)
      } else avisar(r.erro, { erro: true })
    })

  const salvarNome = (e: React.FormEvent) => {
    e.preventDefault()
    if (editando) executar(() => renomearConstrutoraAcao(editando.id, editando.nome), 'Nome atualizado.', () => setEditando(null))
  }

  // Os cartões de cadastro e de exclusão usam a mesma confirmação do restante do painel.
  const pedido: PedidoConfirmacao | null =
    acao === 'criar'
      ? {
          titulo: 'Nova construtora',
          texto: 'Informe o nome. Depois de cadastrada, ela fica disponível para escolher em cada imóvel.',
          rotulo: 'Cadastrar construtora',
          icone: 'mais',
          destrutivo: false,
          campo: { rotulo: 'Nome da construtora', valor: novo, aoMudar: setNovo, placeholder: 'Ex.: Moura Dubeux', maxLength: LIMITE_NOME, minimo: 2 },
          aoConfirmar: () => executar(() => cadastrarConstrutora(novo), 'Construtora cadastrada.', () => setNovo('')),
        }
      : acao
        ? {
            titulo: `Excluir ${acao.nome}?`,
            texto: 'A construtora some do cadastro. Só é possível excluir construtoras sem imóveis vinculados.',
            rotulo: 'Excluir construtora',
            aoConfirmar: () => executar(() => excluirConstrutoraAcao(acao.id), 'Construtora excluída.', () => undefined),
          }
        : null

  const linhas = useMemo(() => {
    const termo = normalizarBusca(busca)
    const filtradas = termo ? construtoras.filter((c) => normalizarBusca(c.nome).includes(termo)) : construtoras
    return [...filtradas].sort((a, b) => {
      for (const { coluna, decrescente } of criterios) {
        const diferenca = coluna === 'imoveis' ? a.imoveis - b.imoveis : porNome(a, b)
        if (diferenca) return decrescente ? -diferenca : diferenca
      }
      return porNome(a, b)
    })
  }, [construtoras, busca, criterios])

  const ordenar = (coluna: Coluna) => {
    setCriterios((atual) => ordenarPor(atual, coluna))
    setPagina(1)
  }

  const semResultado = linhas.length === 0
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  const visiveis = linhas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA)

  return (
    <>
      <div className={s.tabelaBloco}>
        <div className={s.tabelaTopo}>
          <label className={s.campoBusca}>
            <span className="sr-only">Buscar construtora</span>
            <Icone nome="busca" espessura={2} />
            <input className="campo" type="search" placeholder="Buscar construtora" value={busca} onChange={(e) => {
                setBusca(e.target.value)
                setPagina(1)
              }} />
          </label>
          <button type="button" className={`${s.botao} ${s.botaoSol} ${s.tabelaNova}`} onClick={() => setAcao('criar')}>
            <Icone nome="mais" tamanho={17} espessura={2.4} /> <span className={s.tabelaNovaTexto}>Nova construtora</span>
          </button>
        </div>

        <div className={s.tabelaRolagem}>
          <table className={s.tabela} aria-busy={pendente}>
            <caption className="sr-only">Construtoras cadastradas e quantidade de imóveis de cada uma</caption>
            <colgroup>
              <col />
              <col className={s.colunaImoveis} />
              <col className={s.colunaAcoes} />
            </colgroup>
            <thead>
              <tr>
                <Cabecalho coluna="nome" criterios={criterios} aoOrdenar={ordenar}>
                  Construtora
                </Cabecalho>
                <Cabecalho coluna="imoveis" criterios={criterios} aoOrdenar={ordenar}>
                  Imóveis
                </Cabecalho>
                <th scope="col" data-alinhar="fim">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((c) =>
                editando?.id === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={3}>
                      <form className={s.tabelaEdicao} onSubmit={salvarNome}>
                        <input
                          className="campo"
                          aria-label={`Novo nome de ${c.nome}`}
                          maxLength={LIMITE_NOME}
                          value={editando.nome}
                          onChange={(e) => setEditando({ id: c.id, nome: e.target.value })}
                          autoFocus
                        />
                        <button type="submit" className={`${s.botao} ${s.botaoMar}`} disabled={pendente}>
                          Salvar
                        </button>
                        <button type="button" className={`${s.botao} ${s.botaoLinha}`} onClick={() => setEditando(null)}>
                          Cancelar
                        </button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <th scope="row" className={s.tabelaNome}>
                      {c.nome}
                    </th>
                    <td data-alinhar="centro">
                      {c.imoveis > 0 ? (
                        <Link href={`/admin?aba=todos&construtora=${c.id}`} className={s.tabelaQuantidade} title="Ver os imóveis desta construtora, no site e desativados">
                          {c.imoveis}
                        </Link>
                      ) : (
                        <span className={s.tabelaQuantidade} data-zero>
                          0
                        </span>
                      )}
                    </td>
                    <td data-alinhar="fim">
                      {!c.padrao && (
                        <div className={s.tabelaAcoes}>
                          <button
                            type="button"
                            className={`${s.botao} ${s.botaoLinha} ${s.botaoIcone}`}
                            onClick={() => setEditando({ id: c.id, nome: c.nome })}
                            aria-label={`Renomear ${c.nome}`}
                            title="Renomear"
                          >
                            <Icone nome="editar" tamanho={16} />
                          </button>
                          <button
                            type="button"
                            className={`${s.botao} ${s.botaoPerigo} ${s.botaoIcone}`}
                            onClick={() => setAcao(c)}
                            aria-label={`Excluir ${c.nome}`}
                            title="Excluir"
                          >
                            <Icone nome="lixeira" tamanho={17} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ),
              )}
              {semResultado && (
                <tr>
                  <td colSpan={3} className={s.tabelaVazia}>
                    Nenhuma construtora com esse nome.
                  </td>
                </tr>
              )}
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

      <Confirmacao pedido={pedido} aoFechar={() => setAcao(null)} />
    </>
  )
}
