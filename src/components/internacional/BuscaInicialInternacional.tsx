'use client'

// O painel "Encontre seu imóvel" da home (components/home/BuscaInicial), com os textos no idioma e os filtros da lista
// internacional. Leva à lista de imóveis do idioma com os filtros na URL (?situacao=…&cidade=…), que a lista lê ao abrir.

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import s from '@/components/home/BuscaInicial.module.css'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import { TIPOS } from '@/lib/imoveis/formato'
import type { TipoImovel } from '@/lib/imoveis/tipos'

type Modo = 'lancamentos' | 'prontos' | ''

export interface CidadeBusca {
  slug: string
  nome: string
  bairros: { slug: string; nome: string }[]
}

export interface TextosBuscaInicial {
  titulo: string
  modos: [string, string, string]
  modosRotulo: string
  tipo: string
  cidade: string
  bairro: string
  todos: string
  todas: string
  nome: string
  nomeDica: string
  buscar: string
  maisFiltros: string
  menosFiltros: string
  precoMax: string
  qualquerPreco: string
  quartos: string
  banheiros: string
  vagas: string
  tipos: Record<TipoImovel, string>
}

function Passo({ icone, rotulo, valor, max, aoMudar }: { icone: NomeIcone; rotulo: string; valor: number; max: number; aoMudar: (v: number) => void }) {
  return (
    <div className={s.passo} role="group" aria-label={rotulo}>
      <span className={s.passoRotulo}>
        <Icone nome={icone} tamanho={18} />
        {rotulo}
      </span>
      <div className={s.passoControle}>
        <button type="button" aria-label={`${rotulo} −`} disabled={valor === 0} onClick={() => aoMudar(valor - 1)}>
          −
        </button>
        <output aria-live="polite">{valor === 0 ? '0' : `${valor}+`}</output>
        <button type="button" aria-label={`${rotulo} +`} disabled={valor === max} onClick={() => aoMudar(valor + 1)}>
          +
        </button>
      </div>
    </div>
  )
}

export function BuscaInicialInternacional({
  destino,
  cidades,
  precos,
  textos: t,
}: {
  /** Endereço da lista de imóveis no idioma (/en/properties). */
  destino: string
  /** Cidades e bairros dos imóveis da área internacional. */
  cidades: CidadeBusca[]
  /** Opções de preço máximo na moeda do idioma (vazio sem cotação). */
  precos: { valor: string; rotulo: string }[]
  textos: TextosBuscaInicial
}) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('lancamentos')
  const [tipo, setTipo] = useState('')
  const [cidade, setCidade] = useState('')
  const [bairro, setBairro] = useState('')
  const [quartos, setQuartos] = useState(0)
  const [banheiros, setBanheiros] = useState(0)
  const [vagas, setVagas] = useState(0)
  const [q, setQ] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [maisFiltros, setMaisFiltros] = useState(false)
  const idMais = useId()
  const ativosMais = [quartos, banheiros, vagas].filter((v) => v > 0).length

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (modo) params.set('situacao', modo)
    if (tipo) params.set('tipo', tipo)
    if (cidade) params.set('cidade', cidade)
    if (cidade && bairro) params.set('bairro', bairro)
    if (quartos) params.set('quartos', String(quartos))
    if (banheiros) params.set('banheiros', String(banheiros))
    if (vagas) params.set('vagas', String(vagas))
    if (q.trim()) params.set('q', q.trim())
    if (precoMax) params.set('preco', precoMax)
    const query = params.toString()
    router.push(query ? `${destino}?${query}` : destino)
  }

  const modos: { valor: Modo; rotulo: string }[] = [
    { valor: 'lancamentos', rotulo: t.modos[0] },
    { valor: 'prontos', rotulo: t.modos[1] },
    { valor: '', rotulo: t.modos[2] },
  ]

  return (
    <form className={s.painel} role="search" aria-label={t.titulo} action={destino} onSubmit={buscar}>
      <div className={s.cabecalho}>
        <h2 className={s.titulo}>{t.titulo}</h2>
        <button type="button" className={s.maisFiltros} aria-expanded={maisFiltros} aria-controls={idMais} onClick={() => setMaisFiltros((v) => !v)}>
          <Icone nome="filtros" tamanho={15} />
          {maisFiltros ? t.menosFiltros : t.maisFiltros}
          {!maisFiltros && ativosMais > 0 && <span className={s.contagem}>{ativosMais}</span>}
        </button>
      </div>

      <div className={`${s.abas} abas-modo`} role="group" aria-label={t.modosRotulo}>
        {modos.map((m) => (
          <button key={m.valor || 'todos'} type="button" aria-pressed={modo === m.valor} onClick={() => setModo(m.valor)}>
            {m.rotulo}
          </button>
        ))}
      </div>

      <div className={s.campos}>
        <label className={s.campo}>
          {t.tipo}
          <Seletor
            className={s.escuro}
            aria-label={t.tipo}
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[{ valor: '', rotulo: t.todos }, ...TIPOS.map((tp) => ({ valor: tp, rotulo: t.tipos[tp] }))]}
          />
        </label>
        <label className={s.campo}>
          {t.cidade}
          <Seletor
            className={`${s.escuro} ${s.cidade}`}
            aria-label={t.cidade}
            valor={cidade}
            aoMudar={(v) => {
              setCidade(v)
              setBairro('')
            }}
            opcoes={[{ valor: '', rotulo: t.todas }, ...cidades.map((c) => ({ valor: c.slug, rotulo: c.nome }))]}
          />
        </label>
        <label className={s.campo}>
          {t.bairro}
          <Seletor
            className={`${s.escuro} ${s.bairro}`}
            aria-label={t.bairro}
            valor={cidade && bairro ? `${cidade}/${bairro}` : ''}
            aoMudar={(v) => {
              const [c, b] = v.split('/')
              if (b) {
                setCidade(c!)
                setBairro(b)
              } else setBairro('')
            }}
            opcoes={[
              { valor: '', rotulo: t.todos },
              ...cidades
                .filter((c) => !cidade || c.slug === cidade)
                .map((c) => ({ rotulo: c.nome, opcoes: c.bairros.map((b) => ({ valor: `${c.slug}/${b.slug}`, rotulo: b.nome })) })),
            ]}
          />
        </label>

        <div id={idMais} className={`${s.passos} ${s.extra}`} hidden={!maisFiltros}>
          <Passo icone="cama" rotulo={t.quartos} valor={quartos} max={4} aoMudar={setQuartos} />
          <Passo icone="banheira" rotulo={t.banheiros} valor={banheiros} max={3} aoMudar={setBanheiros} />
          <Passo icone="carro" rotulo={t.vagas} valor={vagas} max={3} aoMudar={setVagas} />
        </div>

        <label className={`${s.campo} ${s.extra}`}>
          {t.nome}
          <input className={s.codigo} type="search" name="q" enterKeyHint="search" placeholder={t.nomeDica} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>

        {/* No lugar do quadro do Minha Casa Minha Vida da home em português (não vale para estrangeiros). */}
        {precos.length > 0 && (
          <label className={`${s.campo} ${s.extra}`}>
            {t.precoMax}
            <Seletor
              className={s.escuro}
              aria-label={t.precoMax}
              valor={precoMax}
              aoMudar={setPrecoMax}
              opcoes={[{ valor: '', rotulo: t.qualquerPreco }, ...precos]}
            />
          </label>
        )}
      </div>

      <button type="submit" className={`btn btn-sol ${s.buscar}`}>
        <Icone nome="busca" tamanho={22} espessura={2.2} />
        {t.buscar}
      </button>
    </form>
  )
}
