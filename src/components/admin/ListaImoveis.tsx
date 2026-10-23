'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useDeferredValue, useOptimistic, useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import type { ItemAdmin } from '@/lib/admin/catalogo'
import type { StatusImovel } from '@/lib/imoveis/ajustes'
import { SITUACOES, etiquetaImovel, formatarPreco, normalizarBusca, rotuloPreco, rotuloSituacao } from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import { TEXTO_EXCLUSAO, useMudarStatus } from './status'
import { CorpoPagina, TopoPagina } from './TopoPagina'
import s from './Admin.module.css'

const ABAS = [
  { valor: 'ativo', rotulo: 'No site', resumo: 'publicados no site' },
  { valor: 'inativo', rotulo: 'Desativados', resumo: 'desativados' },
  { valor: 'excluido', rotulo: 'Excluídos', resumo: 'excluídos' },
  { valor: 'vitrine', rotulo: 'Na vitrine', resumo: 'na vitrine da home' },
  { valor: 'editado', rotulo: 'Editados no painel', resumo: 'editados no painel' },
] as const

type Aba = (typeof ABAS)[number]['valor']

const VAZIOS: Record<Aba, [string, string]> = {
  ativo: ['Nenhum imóvel no site', 'Imóveis novos chegam do CRM quando o catálogo é atualizado.'],
  inativo: ['Nenhum imóvel desativado', 'Imóveis desativados saem do site, mas continuam aqui para você reativar quando quiser.'],
  excluido: ['Nenhum imóvel excluído', 'Imóveis excluídos ficam aqui e podem ser restaurados a qualquer momento.'],
  vitrine: ['A vitrine está vazia', 'Escolha o topo e os destaques da página inicial em Vitrine da home.'],
  editado: ['Nenhum imóvel editado', 'Quando você muda algo que veio do CRM, o imóvel aparece aqui.'],
}

const OPCOES_SITUACAO = [
  { valor: '', rotulo: 'Todas as situações' },
  ...SITUACOES.map((st) => ({ valor: rotuloSituacao[st], rotulo: rotuloSituacao[st] })),
  { valor: 'Para alugar', rotulo: 'Para alugar' },
]

const OPCOES_FINALIDADE = [
  { valor: '', rotulo: 'Venda e aluguel' },
  { valor: 'venda', rotulo: 'Venda' },
  { valor: 'aluguel', rotulo: 'Aluguel' },
]

const POR_PAGINA = 24

function naAba(item: ItemAdmin, aba: Aba) {
  if (aba === 'vitrine') return item.status === 'ativo' && (item.heroi || item.destaque)
  if (aba === 'editado') return item.editado && item.status !== 'excluido'
  return item.status === aba
}

function Etiquetas({ item }: { item: ItemAdmin }) {
  const classe = item.finalidade === 'aluguel' ? 'aluguel' : item.situacao
  return (
    <div className={s.etiquetas}>
      <span className={`etiqueta etiqueta-${classe} ${s.etiquetaP}`}>{etiquetaImovel(item)}</span>
      {item.status === 'ativo' && item.heroi && (
        <span className={`${s.marcador} ${s.marcadorVitrine}`}>
          <Icone nome="estrela" tamanho={11} espessura={2} /> Topo da home
        </span>
      )}
      {item.status === 'ativo' && item.destaque && (
        <span className={`${s.marcador} ${s.marcadorVitrine}`}>
          <Icone nome="estrela" tamanho={11} espessura={2} /> Vitrine
        </span>
      )}
      {item.editado && <span className={`${s.marcador} ${s.marcadorEditado}`}>Editado</span>}
      {item.status === 'inativo' && <span className={`${s.marcador} ${s.marcadorDesativado}`}>Desativado</span>}
      {item.status === 'excluido' && <span className={`${s.marcador} ${s.marcadorExcluido}`}>Excluído</span>}
    </div>
  )
}

export function ListaImoveis({
  itens,
  titulo,
  descricao,
  alteracao,
}: {
  itens: ItemAdmin[]
  titulo: string
  descricao: string
  alteracao: string
}) {
  const [lista, aplicarStatus] = useOptimistic(itens, (atual, { id, status }: { id: string; status: StatusImovel }) =>
    atual.map((i) => (i.id === id ? { ...i, status } : i)),
  )
  const { executar } = useMudarStatus((id, status) => aplicarStatus({ id, status }))
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)

  const [aba, setAba] = useState<Aba>('ativo')
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('')
  const [finalidade, setFinalidade] = useState('')
  const [limite, setLimite] = useState(POR_PAGINA)
  const termos = normalizarBusca(useDeferredValue(busca)).split(/\s+/).filter(Boolean)
  const filtrando = termos.length > 0 || situacao !== '' || finalidade !== ''

  // Mudou o filtro: volta para a primeira página.
  const filtrar =
    <T,>(definir: (v: T) => void) =>
    (v: T) => {
      definir(v)
      setLimite(POR_PAGINA)
    }

  const encontrados = lista.filter(
    (item) =>
      naAba(item, aba) &&
      (!situacao || etiquetaImovel(item) === situacao) &&
      (!finalidade || item.finalidade === finalidade) &&
      termos.every((t) => normalizarBusca(`${item.nome} ${item.codigo} ${item.bairro} ${item.cidade}`).includes(t)),
  )
  const visiveis = encontrados.slice(0, limite)
  const abaAtual = ABAS.find((a) => a.valor === aba)!

  const excluir = (item: ItemAdmin) =>
    setPedido({
      titulo: `Excluir ${item.nome}?`,
      texto: TEXTO_EXCLUSAO,
      rotulo: 'Excluir imóvel',
      aoConfirmar: () => executar(item.id, item.nome, 'excluir'),
    })

  return (
    <>
      <TopoPagina titulo={titulo} descricao={descricao}>
        <div className={s.abas} role="group" aria-label="Filtrar por situação no site">
          {ABAS.map((a) => (
            <button
              key={a.valor}
              type="button"
              className={s.aba}
              aria-pressed={aba === a.valor}
              onClick={() => filtrar(setAba)(a.valor)}
            >
              <span>{a.rotulo}</span>
              <strong>{lista.filter((i) => naAba(i, a.valor)).length}</strong>
            </button>
          ))}
        </div>
        <p className={s.topoStatus}>
          <span className={s.ponto} aria-hidden="true" />
          {alteracao}
        </p>
      </TopoPagina>

      <CorpoPagina>
        <div className={s.ferramentas}>
          <label className={s.campoBusca}>
            <span className="sr-only">Buscar imóvel</span>
            <Icone nome="busca" espessura={2} />
            <input
              className="campo"
              type="search"
              placeholder="Nome, código ou bairro"
              value={busca}
              onChange={(e) => filtrar(setBusca)(e.target.value)}
            />
          </label>
          <Seletor aria-label="Situação" className={s.filtro} valor={situacao} aoMudar={filtrar(setSituacao)} opcoes={OPCOES_SITUACAO} />
          <Seletor aria-label="Finalidade" className={s.filtro} valor={finalidade} aoMudar={filtrar(setFinalidade)} opcoes={OPCOES_FINALIDADE} />
        </div>

        <div className={s.contagemLinha}>
          <p className={s.contagem} aria-live="polite">
            <strong>
              {encontrados.length} {encontrados.length === 1 ? 'imóvel' : 'imóveis'}
            </strong>{' '}
            {abaAtual.resumo}
          </p>
          {filtrando && (
            <button
              type="button"
              className={s.limpar}
              onClick={() => {
                setBusca('')
                setSituacao('')
                setFinalidade('')
                setLimite(POR_PAGINA)
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {visiveis.length ? (
          <>
            <ul className={s.lista}>
              {visiveis.map((item) => {
                const editar = `/admin/imoveis/${item.id}`
                return (
                  <li key={item.id}>
                    <article className={s.item} data-status={item.status}>
                      <div className={s.itemTopo}>
                        <div className={s.miniatura}>{item.capa && <Image src={item.capa} alt="" fill sizes="92px" />}</div>
                        <div className={s.itemTexto}>
                          <Etiquetas item={item} />
                          <Link href={editar} className={s.itemNome}>
                            {item.nome}
                          </Link>
                          <span className={s.itemLocal}>
                            {item.bairro}, {item.cidade}
                          </span>
                        </div>
                      </div>
                      <div className={s.itemPreco}>
                        <span>
                          <span>{rotuloPreco(item.finalidade)}</span>
                          <strong>{formatarPreco(item.preco, item.finalidade)}</strong>
                        </span>
                        <span>Cód. {item.codigo}</span>
                      </div>

                      {item.status === 'excluido' ? (
                        <div className={s.itemExcluido}>
                          <span>Fora do site e da busca.</span>
                          <button type="button" className={`${s.botao} ${s.botaoLinha}`} onClick={() => executar(item.id, item.nome, 'restaurar')}>
                            <Icone nome="restaurar" tamanho={16} /> Restaurar
                          </button>
                        </div>
                      ) : (
                        <div className={s.itemAcoes} data-status={item.status}>
                          <Link href={editar} className={`${s.botao} ${s.botaoMar}`}>
                            <Icone nome="editar" tamanho={16} /> Editar
                          </Link>
                          {item.status === 'ativo' ? (
                            <>
                              <button type="button" className={`${s.botao} ${s.botaoLinha}`} onClick={() => executar(item.id, item.nome, 'desativar')}>
                                <Icone nome="olho-fechado" tamanho={16} /> Desativar
                              </button>
                              <a
                                href={urlImovel(item.slug)}
                                target="_blank"
                                rel="noopener"
                                className={`${s.botao} ${s.botaoLinha} ${s.botaoIcone}`}
                                aria-label={`Ver ${item.nome} no site`}
                                title="Ver no site"
                              >
                                <Icone nome="externo" tamanho={17} />
                              </a>
                            </>
                          ) : (
                            <button type="button" className={`${s.botao} ${s.botaoSol}`} onClick={() => executar(item.id, item.nome, 'ativar')}>
                              <Icone nome="olho" tamanho={16} /> Reativar
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${s.botao} ${s.botaoPerigo} ${s.botaoIcone}`}
                            onClick={() => excluir(item)}
                            aria-label={`Excluir ${item.nome}`}
                            title="Excluir"
                          >
                            <Icone nome="lixeira" tamanho={17} />
                          </button>
                        </div>
                      )}
                    </article>
                  </li>
                )
              })}
            </ul>
            {encontrados.length > visiveis.length && (
              <div className={s.paginar}>
                <button type="button" className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} onClick={() => setLimite(limite + POR_PAGINA)}>
                  Carregar mais imóveis
                </button>
                <p>
                  Mostrando {visiveis.length} de {encontrados.length}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className={s.vazio}>
            <span className={s.vazioIcone}>
              <Icone nome="busca" tamanho={24} espessura={2} />
            </span>
            <h2>{filtrando ? 'Nenhum imóvel com essa busca' : VAZIOS[aba][0]}</h2>
            <p>{filtrando ? 'Tente outro nome, código ou bairro, ou limpe os filtros.' : VAZIOS[aba][1]}</p>
          </div>
        )}
      </CorpoPagina>

      <Confirmacao pedido={pedido} aoFechar={() => setPedido(null)} />
    </>
  )
}
