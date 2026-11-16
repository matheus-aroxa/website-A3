'use client'

// A busca da área internacional, com o mesmo desenho da busca em português (components/busca: barra com busca e ordem,
// painel de filtros à esquerda, filtros ativos, paginação e "Carregar mais" no celular). Lá os filtros vão para o
// servidor pela URL; aqui o recorte internacional é pequeno, então a página traz todos os cards (prontos do servidor) e
// filtra no navegador. Os filtros também ficam na URL (?cidade=recife&quartos=2), para o link poder ser compartilhado e
// para a busca da home e os atalhos do rodapé abrirem a lista já filtrada.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import s from '@/components/busca/Busca.module.css'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import { POR_PAGINA, SITUACOES_LANCAMENTO } from '@/lib/imoveis/filtros'
import { SITUACOES, TIPOS, normalizarBusca } from '@/lib/imoveis/formato'
import type { Situacao, TipoImovel } from '@/lib/imoveis/tipos'

export interface ItemLista {
  slug: string
  nome: string
  codigo: string
  cidade: string
  cidadeSlug: string
  tipo: TipoImovel
  situacao: Situacao
  quartos: number
  banheiros: number
  /** -1 quando a vaga é "a consultar". */
  vagas: number
  preco: number
  area: number
  /** Card já renderizado no servidor. */
  card: ReactNode
}

export interface TextosLista {
  buscaRotulo: string
  buscaDica: string
  filtros: string
  fecharFiltros: string
  limparFiltros: string
  limparCurto: string
  ordem: string
  ordemRecentes: string
  ordemMenorPreco: string
  ordemMaiorPreco: string
  ordemMaiorArea: string
  cidade: string
  todasCidades: string
  tipo: string
  situacao: string
  quartos: string
  banheiros: string
  vagas: string
  todos: string
  todas: string
  disponiveisUm: string
  disponiveis: string
  encontradosUm: string
  encontrados: string
  verResultados: string
  nenhumBotao: string
  removerFiltro: string
  limparTudo: string
  nenhumTitulo: string
  nenhumTexto: string
  falarCorretor: string
  paginacao: string
  paginaAnterior: string
  proximaPagina: string
  carregarMais: string
  mostrando: string
  tipos: Record<TipoImovel, string>
  situacoes: Record<Situacao, string>
}

type Ordem = 'recentes' | 'menor-preco' | 'maior-preco' | 'maior-area'

interface Filtros {
  q: string
  cidade: string
  tipos: TipoImovel[]
  situacoes: Situacao[]
  quartos: number
  banheiros: number
  vagas: number
  ordem: Ordem
}

const VAZIO: Filtros = { q: '', cidade: '', tipos: [], situacoes: [], quartos: 0, banheiros: 0, vagas: 0, ordem: 'recentes' }
const ORDENS: Ordem[] = ['recentes', 'menor-preco', 'maior-preco', 'maior-area']

function lerUrl(busca: string): Filtros {
  const p = new URLSearchParams(busca)
  const numero = (chave: string) => Math.max(0, Math.min(4, Number.parseInt(p.get(chave) ?? '', 10) || 0))
  const lista = <T extends string>(chave: string, validos: readonly T[]) =>
    (p.get(chave) ?? '').split(',').filter((v): v is T => (validos as readonly string[]).includes(v))
  const situacao = p.get('situacao')
  const ordem = p.get('ordem') as Ordem
  return {
    q: (p.get('q') ?? '').slice(0, 80),
    cidade: p.get('cidade') ?? '',
    tipos: lista('tipo', TIPOS),
    // Atalhos da home e do rodapé: "lancamentos" (breve lançamento e lançamento) e "prontos".
    situacoes: situacao === 'lancamentos' ? SITUACOES_LANCAMENTO : situacao === 'prontos' ? ['pronto'] : lista('situacao', SITUACOES),
    quartos: numero('quartos'),
    banheiros: numero('banheiros'),
    vagas: numero('vagas'),
    ordem: ORDENS.includes(ordem) ? ordem : 'recentes',
  }
}

function montarUrl(f: Filtros) {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.cidade) p.set('cidade', f.cidade)
  if (f.tipos.length) p.set('tipo', f.tipos.join(','))
  if (f.situacoes.length) p.set('situacao', f.situacoes.join(','))
  for (const chave of ['quartos', 'banheiros', 'vagas'] as const) if (f[chave]) p.set(chave, String(f[chave]))
  if (f.ordem !== 'recentes') p.set('ordem', f.ordem)
  const query = p.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}`
}

/** Mesmos pontos de quebra da busca em português: painel em tela cheia até 959px, "Carregar mais" até 767px. */
function useConsulta(consulta: string) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}

const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item])

function Pilulas({ legenda, valor, opcoes, aoEscolher }: { legenda: string; valor: number; opcoes: [number, string][]; aoEscolher: (v: number) => void }) {
  return (
    <fieldset className={s.grupo}>
      <legend>{legenda}</legend>
      <div className={s.pilulas} style={{ gridTemplateColumns: `minmax(72px, 1.5fr) repeat(${opcoes.length - 1}, minmax(0, 1fr))` }}>
        {opcoes.map(([v, rotulo]) => (
          <button key={v} type="button" className="alternancia" aria-pressed={valor === v} onClick={() => aoEscolher(v)}>
            {rotulo}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const semAssinatura = () => () => {}

export function ListaImoveis({ itens, textos: t, whatsapp }: { itens: ItemLista[]; textos: TextosLista; whatsapp: string }) {
  // Filtros da URL (busca da home, atalhos do rodapé, link compartilhado). No servidor a URL é vazia: o HTML traz a lista
  // completa (para o Google) e, no navegador, a lista já aparece filtrada logo depois de hidratar.
  const daUrl = useSyncExternalStore(semAssinatura, () => window.location.search, () => '')
  const [alterados, setAlterados] = useState<Filtros | null>(null)
  const f = alterados ?? lerUrl(daUrl)
  const [textoDigitado, setTexto] = useState<string | null>(null)
  const texto = textoDigitado ?? f.q
  const [pagina, setPagina] = useState(1)
  const [painelAberto, setPainelAberto] = useState(false)
  const telaCheia = useConsulta('(max-width: 959px)')
  const celular = useConsulta('(max-width: 767px)')
  const fecharRef = useRef<HTMLButtonElement>(null)

  // Cada mudança vai para a URL (sem recarregar), para o link continuar valendo.
  useEffect(() => {
    if (alterados) history.replaceState(history.state, '', montarUrl(alterados))
  }, [alterados])

  // A busca por nome espera a pessoa parar de digitar.
  useEffect(() => {
    if (textoDigitado === null) return
    const id = setTimeout(() => {
      setAlterados((atual) => {
        const base = atual ?? lerUrl(window.location.search)
        return base.q === textoDigitado ? base : { ...base, q: textoDigitado }
      })
      setPagina(1)
    }, 300)
    return () => clearTimeout(id)
  }, [textoDigitado])

  useEffect(() => {
    if (!painelAberto || !telaCheia) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setPainelAberto(false)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anterior
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [painelAberto, telaCheia])

  const aplicar = (alteracao: Partial<Filtros>) => {
    setAlterados((atual) => ({ ...(atual ?? lerUrl(window.location.search)), ...alteracao }))
    setPagina(1)
  }
  const limpar = () => {
    setAlterados({ ...VAZIO, ordem: f.ordem })
    setTexto('')
    setPagina(1)
  }

  const cidades = useMemo(
    () => [...new Map(itens.map((i) => [i.cidadeSlug, i.cidade])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [itens],
  )

  const achados = useMemo(() => {
    const q = normalizarBusca(f.q)
    const filtrados = itens.filter(
      (i) =>
        (!q || normalizarBusca(i.nome).includes(q) || i.codigo.toLowerCase().includes(q)) &&
        (!f.cidade || i.cidadeSlug === f.cidade) &&
        (!f.tipos.length || f.tipos.includes(i.tipo)) &&
        (!f.situacoes.length || f.situacoes.includes(i.situacao)) &&
        i.quartos >= f.quartos &&
        i.banheiros >= f.banheiros &&
        (f.vagas === 0 || i.vagas >= f.vagas),
    )
    if (f.ordem === 'recentes') return filtrados
    // Sem preço ("sob consulta") fica no fim nas duas ordens de preço.
    const preco = (i: ItemLista) => (i.preco > 0 ? i.preco : f.ordem === 'menor-preco' ? Infinity : -Infinity)
    return [...filtrados].sort((a, b) =>
      f.ordem === 'menor-preco' ? preco(a) - preco(b) : f.ordem === 'maior-preco' ? preco(b) - preco(a) : b.area - a.area,
    )
  }, [itens, f])

  const total = achados.length
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  // Celular: "Carregar mais" acrescenta à lista. Computador: uma página por vez.
  const visiveis = celular ? achados.slice(0, atual * POR_PAGINA) : achados.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA)

  const chips: { chave: string; rotulo: string; remover: Partial<Filtros> }[] = [
    ...(f.q.trim() ? [{ chave: 'q', rotulo: `“${f.q.trim()}”`, remover: { q: '' } }] : []),
    ...(f.cidade ? [{ chave: 'cidade', rotulo: cidades.find(([slug]) => slug === f.cidade)?.[1] ?? f.cidade, remover: { cidade: '' } }] : []),
    ...f.tipos.map((tp) => ({ chave: `tipo-${tp}`, rotulo: t.tipos[tp], remover: { tipos: f.tipos.filter((x) => x !== tp) } })),
    ...f.situacoes.map((st) => ({ chave: `sit-${st}`, rotulo: t.situacoes[st], remover: { situacoes: f.situacoes.filter((x) => x !== st) } })),
    ...(f.quartos ? [{ chave: 'quartos', rotulo: `${f.quartos}+ ${t.quartos.toLowerCase()}`, remover: { quartos: 0 } }] : []),
    ...(f.banheiros ? [{ chave: 'banheiros', rotulo: `${f.banheiros}+ ${t.banheiros.toLowerCase()}`, remover: { banheiros: 0 } }] : []),
    ...(f.vagas ? [{ chave: 'vagas', rotulo: `${f.vagas}+ ${t.vagas.toLowerCase()}`, remover: { vagas: 0 } }] : []),
  ]
  const nAtivos = chips.filter((c) => c.chave !== 'q').length
  const contagem = chips.length
    ? total === 1
      ? t.encontradosUm
      : t.encontrados.replace('{n}', String(total))
    : total === 1
      ? t.disponiveisUm
      : t.disponiveis.replace('{n}', String(total))

  function irParaPagina(n: number) {
    setPagina(n)
    document.getElementById('resultados')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <>
      <div className={s.topoBarra}>
        <div className="container">
          <form role="search" className={s.barra} onSubmit={(e) => e.preventDefault()}>
            <label className={s.campoBusca}>
              <span className="sr-only">{t.buscaRotulo}</span>
              <Icone nome="busca" espessura={2} />
              <input
                className="campo"
                type="search"
                name="q"
                enterKeyHint="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={t.buscaDica}
              />
            </label>
            <div className={s.barraAcoes}>
              <button type="button" className={s.botaoFiltros} onClick={() => setPainelAberto(true)} aria-controls="painel-filtros">
                <Icone nome="filtros" />
                {t.filtros}
                {nAtivos > 0 && <span className={s.contador}>{nAtivos}</span>}
              </button>
              <label className={s.ordenar}>
                <span className={s.ordenarRotulo}>{t.ordem}</span>
                <Seletor
                  valor={f.ordem}
                  aoMudar={(v) => aplicar({ ordem: v as Ordem })}
                  aria-label={t.ordem}
                  opcoes={[
                    { valor: 'recentes', rotulo: t.ordemRecentes },
                    { valor: 'menor-preco', rotulo: t.ordemMenorPreco },
                    { valor: 'maior-preco', rotulo: t.ordemMaiorPreco },
                    { valor: 'maior-area', rotulo: t.ordemMaiorArea },
                  ]}
                />
              </label>
            </div>
          </form>
        </div>
      </div>

      <section className={s.corpo} aria-label={t.filtros}>
        <div className={`container ${s.corpoGrade}`}>
          <aside
            id="painel-filtros"
            className={s.painel}
            data-aberto={painelAberto || undefined}
            aria-label={t.filtros}
            {...(painelAberto && telaCheia && { role: 'dialog', 'aria-modal': true })}
          >
            <div className={s.painelTopo}>
              <button ref={fecharRef} type="button" className={s.fecharPainel} aria-label={t.fecharFiltros} onClick={() => setPainelAberto(false)}>
                <Icone nome="fechar" tamanho={22} espessura={2} />
              </button>
              <h2>{t.filtros}</h2>
              <button type="button" className="link-texto" onClick={limpar}>
                <span className={s.limparLongo}>{t.limparFiltros}</span>
                <span className={s.limparCurto}>{t.limparCurto}</span>
              </button>
            </div>

            <div className={s.painelCorpo}>
              <label className={`${s.rotuloCampo} ${s.rotuloForte}`}>
                {t.cidade}
                <Seletor
                  aria-label={t.cidade}
                  valor={f.cidade}
                  aoMudar={(v) => aplicar({ cidade: v })}
                  opcoes={[{ valor: '', rotulo: t.todasCidades }, ...cidades.map(([slug, nome]) => ({ valor: slug, rotulo: nome }))]}
                />
              </label>

              <fieldset className={s.grupo}>
                <legend>{t.tipo}</legend>
                <div className={s.chipsColuna}>
                  {TIPOS.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      className="alternancia alternancia-pilula"
                      aria-pressed={f.tipos.includes(tp)}
                      onClick={() => aplicar({ tipos: alternar(f.tipos, tp) })}
                    >
                      {t.tipos[tp]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={s.grupo}>
                <legend>{t.situacao}</legend>
                <div className={s.chipsColuna}>
                  {SITUACOES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      className="alternancia alternancia-pilula"
                      aria-pressed={f.situacoes.includes(st)}
                      onClick={() => aplicar({ situacoes: alternar(f.situacoes, st) })}
                    >
                      {t.situacoes[st]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Pilulas legenda={t.quartos} valor={f.quartos} opcoes={[[0, t.todos], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+']]} aoEscolher={(v) => aplicar({ quartos: v })} />
              <Pilulas legenda={t.banheiros} valor={f.banheiros} opcoes={[[0, t.todos], [1, '1+'], [2, '2+'], [3, '3+']]} aoEscolher={(v) => aplicar({ banheiros: v })} />
              <Pilulas legenda={t.vagas} valor={f.vagas} opcoes={[[0, t.todas], [1, '1+'], [2, '2+'], [3, '3+']]} aoEscolher={(v) => aplicar({ vagas: v })} />
            </div>

            <div className={s.painelRodape}>
              <button
                type="button"
                className="btn btn-mar btn-quadrado btn-bloco"
                style={{ height: 54, fontSize: 16 }}
                onClick={() => {
                  setPainelAberto(false)
                  document.getElementById('resultados')?.scrollIntoView({ block: 'start' })
                }}
              >
                {total === 0 ? t.nenhumBotao : t.verResultados.replace('{n}', String(total))}
              </button>
            </div>
          </aside>

          <div id="resultados" className={s.resultados}>
            <div className={s.resumo}>
              <p className={s.total} aria-live="polite">
                <strong>{contagem}</strong>
              </p>
              {chips.length > 0 && (
                <div className={s.chips}>
                  {chips.map((c) => (
                    <button key={c.chave} type="button" className={s.chip} onClick={() => {
                        aplicar(c.remover)
                        if (c.chave === 'q') setTexto('')
                      }} aria-label={`${t.removerFiltro}: ${c.rotulo}`}>
                      {c.rotulo}
                      <Icone nome="fechar" tamanho={16} espessura={2.2} />
                    </button>
                  ))}
                  <button type="button" className={s.limparTudo} onClick={limpar}>
                    {t.limparTudo}
                  </button>
                </div>
              )}
            </div>

            {total === 0 ? (
              <div className={s.vazio}>
                <span className={s.vazioIcone}>
                  <Icone nome="busca" tamanho={26} espessura={2} />
                </span>
                <h2>{t.nenhumTitulo}</h2>
                <p>{t.nenhumTexto}</p>
                <div className={s.vazioAcoes}>
                  <button type="button" className="btn btn-mar btn-quadrado" onClick={limpar}>
                    {t.limparFiltros}
                  </button>
                  <a className="btn btn-linha btn-quadrado" href={whatsapp} target="_blank" rel="noopener" data-rastro="busca-sem-resultado">
                    {t.falarCorretor}
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className={s.grade}>
                  {visiveis.map((i) => (
                    <div key={i.slug} style={{ display: 'contents' }}>
                      {i.card}
                    </div>
                  ))}
                </div>

                {celular && visiveis.length < total && (
                  <div className={s.carregarMais}>
                    <button type="button" className="btn btn-linha btn-quadrado btn-bloco" style={{ height: 54, fontSize: 16 }} onClick={() => setPagina(atual + 1)}>
                      {t.carregarMais}
                    </button>
                    <p>{t.mostrando.replace('{n}', String(visiveis.length)).replace('{total}', String(total))}</p>
                  </div>
                )}

                {totalPaginas > 1 && (
                  <nav aria-label={t.paginacao} className={s.paginacao}>
                    <ol>
                      <li>
                        <button
                          type="button"
                          className={`${s.paginaTexto} ${atual === 1 ? s.desativada : ''}`}
                          disabled={atual === 1}
                          aria-label={t.paginaAnterior}
                          onClick={() => irParaPagina(atual - 1)}
                        >
                          <Icone nome="chevron-esquerda" tamanho={16} espessura={2} />
                        </button>
                      </li>
                      <li>
                        <span className={s.pagina} aria-current="page">
                          {atual}
                        </span>
                      </li>
                      <li>
                        <button
                          type="button"
                          className={`${s.paginaTexto} ${atual === totalPaginas ? s.desativada : ''}`}
                          disabled={atual === totalPaginas}
                          aria-label={t.proximaPagina}
                          onClick={() => irParaPagina(atual + 1)}
                        >
                          <Icone nome="chevron-direita" tamanho={16} espessura={2} />
                        </button>
                      </li>
                    </ol>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
