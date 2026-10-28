'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import logoMcmv from '@/assets/marca/logo-mcmv.png'
import { Icone } from '@/components/ui/Icone'
import { SITUACOES, TIPOS, normalizarBusca, pluralImoveis, rotuloSituacao, rotuloTipo } from '@/lib/imoveis/formato'
import { ENTREGAS, aplicarAlteracao, limparFiltros, type Entrega, type Filtros } from '@/lib/imoveis/filtros'
import { Seletor } from '@/components/ui/Seletor'
import type { Construtora } from '@/lib/imoveis/tipos'
import { useBusca } from './ContextoBusca'
import { useAdiado } from './useAdiado'
import s from './Busca.module.css'

const MODOS: { valor: Filtros['categoria']; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'venda', rotulo: 'Comprar' },
  { valor: 'aluguel', rotulo: 'Alugar' },
]

/** Escolha de várias construtoras: caixas de marcar numa lista rolável, com busca quando a lista é grande. */
function ListaConstrutoras({
  construtoras,
  marcadas,
  aoMudar,
}: {
  construtoras: Construtora[]
  marcadas: string[]
  aoMudar: (slugs: string[]) => void
}) {
  const [busca, setBusca] = useState('')
  const termo = normalizarBusca(busca)
  const visiveis = termo ? construtoras.filter((c) => normalizarBusca(c.nome).includes(termo)) : construtoras
  const alternar = (slug: string) => aoMudar(marcadas.includes(slug) ? marcadas.filter((x) => x !== slug) : [...marcadas, slug])
  return (
    <div className={s.construtoras}>
      {construtoras.length > 8 && (
        <input
          type="search"
          className="campo"
          aria-label="Buscar construtora"
          placeholder="Buscar construtora"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      )}
      <div className={s.construtorasLista} role="group" aria-label="Construtoras">
        {visiveis.map((c) => (
          <label key={c.slug} className={s.construtoraOpcao}>
            <input type="checkbox" className="caixa" checked={marcadas.includes(c.slug)} onChange={() => alternar(c.slug)} />
            {c.nome}
          </label>
        ))}
        {!visiveis.length && <p className={s.construtorasVazio}>Nenhuma construtora encontrada.</p>}
      </div>
      {marcadas.length > 0 && (
        <button type="button" className={s.construtorasLimpar} onClick={() => aoMudar([])}>
          Limpar seleção ({marcadas.length})
        </button>
      )}
    </div>
  )
}

function Pilulas({
  legenda,
  valor,
  opcoes,
  aoEscolher,
}: {
  legenda: string
  valor: number
  opcoes: [number, string][]
  aoEscolher: (v: number) => void
}) {
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

function CampoArea({ rotulo, valor, placeholder, aoMudar }: { rotulo: string; valor: number | null; placeholder: string; aoMudar: (v: number | null) => void }) {
  const [texto, setTexto] = useState(valor ? String(valor) : '')
  const [anterior, setAnterior] = useState(valor)
  if (valor !== anterior) {
    setAnterior(valor)
    setTexto(valor ? String(valor) : '')
  }
  const [agendar, cancelar] = useAdiado((t: string) => {
    const n = Number.parseFloat(t.replace(',', '.'))
    aoMudar(Number.isFinite(n) && n > 0 ? n : null)
  }, 700)
  return (
    <label className={s.rotuloCampo}>
      {rotulo}
      <input
        className="campo"
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={texto}
        onChange={(e) => {
          const limpo = e.target.value.replace(/[^\d,.]/g, '')
          setTexto(limpo)
          agendar(limpo)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            cancelar()
            const n = Number.parseFloat(texto.replace(',', '.'))
            aoMudar(Number.isFinite(n) && n > 0 ? n : null)
          }
        }}
      />
    </label>
  )
}

const CONSULTA_TELA_CHEIA = '(max-width: 959px)'

function useTelaCheia() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(CONSULTA_TELA_CHEIA)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(CONSULTA_TELA_CHEIA).matches,
    () => false,
  )
}

export function PainelFiltros() {
  const busca = useBusca()
  const { cidades, construtoras, total, pendente, painelAberto, setPainelAberto } = busca
  // No celular o painel edita um rascunho, que só vira busca ao tocar em "Aplicar filtros".
  // No desktop cada alteração é aplicada na hora.
  const telaCheia = useTelaCheia()
  const [rascunho, setRascunho] = useState(busca.filtros)
  const [abertoAntes, setAbertoAntes] = useState(painelAberto)
  if (painelAberto !== abertoAntes) {
    setAbertoAntes(painelAberto)
    if (painelAberto) setRascunho(busca.filtros)
  }
  const usarRascunho = telaCheia && painelAberto
  const f = usarRascunho ? rascunho : busca.filtros
  const aplicar = (alteracao: Partial<Filtros>) =>
    usarRascunho ? setRascunho((r) => aplicarAlteracao(r, alteracao)) : busca.aplicar(alteracao)
  const limpar = () => (usarRascunho ? setRascunho((r) => limparFiltros(r)) : busca.limpar())
  const fecharRef = useRef<HTMLButtonElement>(null)
  const aluguel = f.categoria === 'aluguel'
  const cidade = cidades.find((c) => c.slug === f.cidade)

  useEffect(() => {
    if (!painelAberto) return
    if (!telaCheia) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setPainelAberto(false)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anterior
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [painelAberto, setPainelAberto, telaCheia])

  function alternar<T>(lista: T[], item: T) {
    return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]
  }

  function fecharEVerResultados() {
    if (usarRascunho) busca.substituir(rascunho)
    setPainelAberto(false)
    document.getElementById('resultados')?.scrollIntoView({ block: 'start' })
  }

  const textoBotao = usarRascunho
    ? 'Aplicar filtros'
    : pendente
    ? 'Atualizando…'
    : total === 0
      ? 'Nenhum imóvel — ajuste os filtros'
      : total === null
        ? 'Ver imóveis'
        : `Ver ${pluralImoveis(total)}`

  return (
    <aside
      id="painel-filtros"
      className={s.painel}
      data-aberto={painelAberto || undefined}
      aria-label="Filtros"
      {...(painelAberto && { role: 'dialog', 'aria-modal': true })}
    >
      <div className={s.painelTopo}>
        <button ref={fecharRef} type="button" className={s.fecharPainel} aria-label="Fechar filtros" onClick={() => setPainelAberto(false)}>
          <Icone nome="fechar" tamanho={22} espessura={2} />
        </button>
        <h2>Filtros</h2>
        <button type="button" className="link-texto" onClick={limpar}>
          <span className={s.limparLongo}>Limpar filtros</span>
          <span className={s.limparCurto}>Limpar</span>
        </button>
      </div>

      <div className={s.painelCorpo}>
        <fieldset className={s.grupo}>
          <legend>Finalidade</legend>
          <div className="segmentado">
            {MODOS.map((m) => (
              <button key={m.valor} type="button" aria-pressed={f.categoria === m.valor} onClick={() => aplicar({ categoria: m.valor })}>
                {m.rotulo}
              </button>
            ))}
          </div>
        </fieldset>

        {!aluguel && (
          <label className={s.mcmv}>
            <Image src={logoMcmv} alt="" width={44} height={44} className={s.mcmvLogo} />
            <span>
              <strong>Minha Casa Minha Vida</strong>
              <span>Só imóveis elegíveis ao programa</span>
            </span>
            <input type="checkbox" className="caixa" checked={f.mcmv} onChange={(e) => aplicar({ mcmv: e.target.checked })} />
          </label>
        )}

        <fieldset className={`${s.grupo} ${s.empilhado}`}>
          <legend>Localização</legend>
          <label className={s.rotuloCampo}>
            Cidade
            <Seletor
              aria-label="Cidade"
              valor={f.cidade ?? ''}
              aoMudar={(v) => aplicar({ cidade: v || null, bairro: null })}
              opcoes={[{ valor: '', rotulo: 'Todas as cidades' }, ...cidades.map((c) => ({ valor: c.slug, rotulo: c.nome }))]}
            />
          </label>
          <label className={s.rotuloCampo}>
            Bairro
            <Seletor
              aria-label="Bairro"
              valor={f.cidade && f.bairro ? `${f.cidade}/${f.bairro}` : ''}
              aoMudar={(v) => {
                const [c, b] = v.split('/')
                aplicar(b ? { cidade: c!, bairro: b } : { bairro: null })
              }}
              opcoes={[
                { valor: '', rotulo: 'Todos os bairros' },
                ...(cidade ? [cidade] : cidades).map((c) => ({
                  rotulo: c.nome,
                  opcoes: c.bairros.map((b) => ({ valor: `${c.slug}/${b.slug}`, rotulo: b.nome })),
                })),
              ]}
            />
          </label>
        </fieldset>

        {construtoras.length > 0 && (
          <fieldset className={s.grupo}>
            <legend>Construtora</legend>
            <ListaConstrutoras construtoras={construtoras} marcadas={f.construtoras} aoMudar={(c) => aplicar({ construtoras: c })} />
          </fieldset>
        )}

        <fieldset className={s.grupo}>
          <legend>Tipo de imóvel</legend>
          <div className={s.chipsColuna}>
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                className="alternancia alternancia-pilula"
                aria-pressed={f.tipos.includes(t)}
                onClick={() => aplicar({ tipos: alternar(f.tipos, t) })}
              >
                {rotuloTipo[t]}
              </button>
            ))}
          </div>
        </fieldset>

        {!aluguel && (
          <fieldset className={s.grupo}>
            <legend>Situação</legend>
            <div className={s.chipsColuna}>
              {SITUACOES.map((sit) => (
                <button
                  key={sit}
                  type="button"
                  className="alternancia alternancia-pilula"
                  aria-pressed={f.situacoes.includes(sit)}
                  onClick={() => aplicar({ situacoes: alternar(f.situacoes, sit) })}
                >
                  {rotuloSituacao[sit]}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <Pilulas legenda="Quartos" valor={f.quartos} opcoes={[[0, 'Todos'], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+']]} aoEscolher={(v) => aplicar({ quartos: v })} />
        <Pilulas legenda="Banheiros" valor={f.banheiros} opcoes={[[0, 'Todos'], [1, '1+'], [2, '2+'], [3, '3+']]} aoEscolher={(v) => aplicar({ banheiros: v })} />
        <Pilulas legenda="Vagas de garagem" valor={f.vagas} opcoes={[[0, 'Todas'], [1, '1+'], [2, '2+'], [3, '3+']]} aoEscolher={(v) => aplicar({ vagas: v })} />

        <fieldset className={s.grupo}>
          <legend>Área privativa</legend>
          <div className={s.duasColunas}>
            <CampoArea rotulo="De" valor={f.areaMin} placeholder="0 m²" aoMudar={(v) => aplicar({ areaMin: v })} />
            <CampoArea rotulo="Até" valor={f.areaMax} placeholder="Sem limite" aoMudar={(v) => aplicar({ areaMax: v })} />
          </div>
        </fieldset>

        {!aluguel && (
          <label className={`${s.rotuloCampo} ${s.rotuloForte}`}>
            Previsão de entrega
            <Seletor
              aria-label="Previsão de entrega"
              valor={f.entrega ?? ''}
              aoMudar={(v) => aplicar({ entrega: (v || null) as Entrega | null })}
              opcoes={[{ valor: '', rotulo: 'Qualquer data' }, ...ENTREGAS.map((e) => ({ valor: e.valor, rotulo: e.rotulo }))]}
            />
          </label>
        )}
      </div>

      <div className={s.painelRodape}>
        <button type="button" className="btn btn-mar btn-quadrado btn-bloco" style={{ height: 54, fontSize: 16 }} onClick={fecharEVerResultados}>
          {textoBotao}
        </button>
      </div>
    </aside>
  )
}
