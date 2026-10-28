'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import type { AbaAdmin, CatalogoAdmin, FiltroAdmin, ItemAdmin } from '@/lib/admin/catalogo'
import type { ConstrutoraAdmin } from '@/lib/imoveis/construtoras'
import type { StatusImovel } from '@/lib/imoveis/painel'
import { SITUACOES, etiquetaImovel, formatarPreco, rotuloPreco, rotuloSituacao } from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import { TEXTO_EXCLUSAO, useMudarStatus } from './status'
import { CorpoPagina, TopoPagina } from './TopoPagina'
import s from './Admin.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

const ABAS = [
  { valor: 'ativo', rotulo: 'No site', resumo: 'publicados no site' },
  { valor: 'inativo', rotulo: 'Desativados', resumo: 'desativados' },
  { valor: 'vitrine', rotulo: 'Na vitrine', resumo: 'na vitrine da home' },
] as const

type Aba = (typeof ABAS)[number]['valor']

/** Sem botão: aberta pelo link da quantidade de imóveis na página de construtoras. Mostra os dois status, separados. */
const GRUPOS_TODOS = [
  { status: 'ativo', titulo: 'No site', resumo: 'no site' },
  { status: 'inativo', titulo: 'Desativados', resumo: 'desativados' },
] as const

const VAZIOS: Record<AbaAdmin, [string, string]> = {
  ativo: ['Nenhum imóvel no site', 'Cadastre um imóvel novo e ele aparece aqui e no site.'],
  inativo: ['Nenhum imóvel desativado', 'Imóveis desativados saem do site, mas continuam aqui para você reativar quando quiser.'],
  vitrine: ['A vitrine está vazia', 'Escolha o topo e os destaques da página inicial em Vitrine da home.'],
  todos: ['Nenhum imóvel cadastrado', 'Cadastre um imóvel novo e ele aparece aqui e no site.'],
}

const OPCOES_SITUACAO = [
  { valor: '', rotulo: 'Todas as situações' },
  ...SITUACOES.map((st) => ({ valor: st, rotulo: rotuloSituacao[st] })),
  { valor: 'alugar', rotulo: 'Para alugar' },
]

const OPCOES_FINALIDADE = [
  { valor: '', rotulo: 'Venda e aluguel' },
  { valor: 'venda', rotulo: 'Venda' },
  { valor: 'aluguel', rotulo: 'Aluguel' },
]

/** Espera o fim da digitação antes de buscar no servidor. */
const ESPERA_BUSCA_MS = 350

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
      {item.criado && <span className={`${s.marcador} ${s.marcadorCriado}`}>Cadastrado no painel</span>}
      {item.status === 'inativo' && <span className={`${s.marcador} ${s.marcadorDesativado}`}>Desativado</span>}
    </div>
  )
}

export function ListaImoveis({
  catalogo,
  filtro,
  titulo,
  descricao,
  construtoras,
}: {
  catalogo: CatalogoAdmin
  filtro: FiltroAdmin
  construtoras: ConstrutoraAdmin[]
  titulo: string
  descricao: string
}) {
  const { itens, total, porStatus, pagina, totalPaginas, contagens } = catalogo
  const aba = filtro.aba
  // `status: null` é imóvel excluído: some da lista na hora.
  const [lista, aplicarStatus] = useOptimistic(itens, (atual, { id, status }: { id: string; status: StatusImovel | null }) =>
    status ? atual.map((i) => (i.id === id ? { ...i, status } : i)) : atual.filter((i) => i.id !== id),
  )
  const { executar, excluir: excluirImovel } = useMudarStatus((id, status) => aplicarStatus({ id, status }))
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)

  // Aba, busca, filtros e página moram na URL: o servidor devolve só a página pedida.
  const router = useRouter()
  const caminho = usePathname()
  const [navegando, navegar] = useTransition()
  const [busca, setBusca] = useState(filtro.q)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(espera.current), [])

  const href = (mudanca: Partial<FiltroAdmin>) => {
    const f = { ...filtro, ...mudanca }
    const sp = new URLSearchParams()
    if (f.aba !== 'ativo') sp.set('aba', f.aba)
    if (f.q.trim()) sp.set('q', f.q.trim())
    if (f.situacao) sp.set('situacao', f.situacao)
    if (f.finalidade) sp.set('finalidade', f.finalidade)
    if (f.construtora) sp.set('construtora', f.construtora)
    if (f.pagina > 1) sp.set('pagina', String(f.pagina))
    const query = sp.toString()
    return query ? `${caminho}?${query}` : caminho
  }
  // Mudou a aba ou o filtro: volta para a primeira página.
  const ir = (mudanca: Partial<FiltroAdmin>) => navegar(() => router.replace(href({ pagina: 1, ...mudanca }), { scroll: false }))
  const buscar = (q: string) => {
    setBusca(q)
    clearTimeout(espera.current)
    espera.current = setTimeout(() => ir({ q }), ESPERA_BUSCA_MS)
  }

  const filtrando = Boolean(filtro.q.trim() || filtro.situacao || filtro.finalidade || filtro.construtora)
  // Até o servidor responder, o imóvel que mudou de status já sai da aba onde estava e as contagens acompanham.
  const visiveis = lista.filter((i) => aba === 'todos' || (aba === 'vitrine' ? i.status === 'ativo' : i.status === aba))
  const statusNoServidor = new Map(itens.map((i) => [i.id, i.status]))
  const movidos = lista.filter((i) => statusNoServidor.get(i.id) !== i.status)
  const excluidos = itens.filter((i) => !lista.some((l) => l.id === i.id))
  const ajustar = (n: number, st: StatusImovel) =>
    n -
    movidos.filter((i) => statusNoServidor.get(i.id) === st).length +
    movidos.filter((i) => i.status === st).length -
    excluidos.filter((i) => i.status === st).length
  const contagem = (a: Aba) => (a === 'vitrine' ? contagens[a] : ajustar(contagens[a], a))
  // Na aba "todos", publicados e desativados em seções separadas (o servidor já manda os publicados primeiro).
  const grupos = GRUPOS_TODOS.map((g) => ({
    ...g,
    total: ajustar(porStatus[g.status], g.status),
    itens: visiveis.filter((i) => i.status === g.status),
  }))

  const excluir = (item: ItemAdmin) =>
    setPedido({
      titulo: `Excluir ${item.nome}?`,
      texto: TEXTO_EXCLUSAO,
      rotulo: 'Excluir imóvel',
      aoConfirmar: () => excluirImovel(item.id, item.nome),
    })

  const cartao = (item: ItemAdmin) => {
    const editar = `/admin/imoveis/${item.id}`
    return (
      <li key={item.id}>
        <article className={s.item} data-status={item.status}>
          <div className={s.itemTopo}>
            <div className={s.miniatura}>{item.capa && <Image loader={carregadorImagem} src={item.capa} alt="" fill sizes="92px" />}</div>
            <div className={s.itemTexto}>
              <Etiquetas item={item} />
              <Link href={editar} className={s.itemNome}>
                {item.nome}
              </Link>
              <span className={s.itemLocal}>
                {item.bairro}, {item.cidade} · {item.construtora}
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
        </article>
      </li>
    )
  }

  const listaDe = (doGrupo: ItemAdmin[]) => (
    <ul className={s.lista} aria-busy={navegando} style={navegando ? { opacity: 0.55 } : undefined}>
      {doGrupo.map(cartao)}
    </ul>
  )

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
              onClick={() => ir({ aba: a.valor })}
            >
              <span>{a.rotulo}</span>
              <strong>{contagem(a.valor)}</strong>
            </button>
          ))}
        </div>
        <Link href="/admin/imoveis/novo" className={`${s.botao} ${s.botaoSol} ${s.botaoG}`}>
          <Icone nome="mais" tamanho={17} espessura={2.4} /> Novo imóvel
        </Link>
      </TopoPagina>

      <CorpoPagina>
        <div className={s.ferramentas}>
          <label className={s.campoBusca}>
            <span className="sr-only">Buscar imóvel</span>
            <Icone nome="busca" espessura={2} />
            <input
              className="campo"
              type="search"
              placeholder="Nome ou código do imóvel"
              value={busca}
              onChange={(e) => buscar(e.target.value)}
            />
          </label>
          <Seletor aria-label="Situação" className={s.filtro} valor={filtro.situacao} aoMudar={(situacao) => ir({ situacao })} opcoes={OPCOES_SITUACAO} />
          <Seletor aria-label="Finalidade" className={s.filtro} valor={filtro.finalidade} aoMudar={(finalidade) => ir({ finalidade })} opcoes={OPCOES_FINALIDADE} />
          <Seletor
            aria-label="Construtora"
            className={s.filtro}
            valor={filtro.construtora}
            aoMudar={(construtora) => ir({ construtora })}
            opcoes={[{ valor: '', rotulo: 'Todas as construtoras' }, ...construtoras.map((c) => ({ valor: String(c.id), rotulo: c.nome }))]}
          />
        </div>

        <div className={s.contagemLinha}>
          <p className={s.contagem} aria-live="polite">
            <strong>
              {total} {total === 1 ? 'imóvel' : 'imóveis'}
            </strong>{' '}
            {aba === 'todos'
              ? `: ${grupos.map((g) => `${g.total} ${g.resumo}`).join(' e ')}`
              : ABAS.find((a) => a.valor === aba)!.resumo}
          </p>
          {filtrando && (
            <button
              type="button"
              className={s.limpar}
              onClick={() => {
                setBusca('')
                ir({ q: '', situacao: '', finalidade: '', construtora: '' })
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {visiveis.length ? (
          <>
            {aba === 'todos'
              ? grupos
                  .filter((g) => g.itens.length)
                  .map((g) => (
                    <section key={g.status} className={s.grupo} aria-labelledby={`grupo-${g.status}`}>
                      <h2 id={`grupo-${g.status}`} className={s.grupoTitulo} data-status={g.status}>
                        {g.titulo} <span>{g.total}</span>
                      </h2>
                      {listaDe(g.itens)}
                    </section>
                  ))
              : listaDe(visiveis)}
            {totalPaginas > 1 && (
              <nav className={s.paginar} aria-label="Páginas">
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {pagina > 1 && (
                    <Link href={href({ pagina: pagina - 1 })} scroll className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} prefetch={false}>
                      Anterior
                    </Link>
                  )}
                  {pagina < totalPaginas && (
                    <Link href={href({ pagina: pagina + 1 })} scroll className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`} prefetch={false}>
                      Próxima
                    </Link>
                  )}
                </div>
                <p>
                  Página {pagina} de {totalPaginas}
                </p>
              </nav>
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
