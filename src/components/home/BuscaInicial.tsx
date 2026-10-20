'use client'

// Painel de filtros em vidro, na lateral direita do hero. Monta a mesma URL que o painel de filtros
// da busca (ex.: /imoveis/venda/apartamentos/paulista/jaguaribe?quartos=2) e navega até ela.
// Sem JavaScript o formulário ainda funciona: envia ?q= para /imoveis.

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import logoMcmv from '@/assets/marca/logo-mcmv.png'
import { Icone, type NomeIcone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import { TIPOS, rotuloTipoPlural } from '@/lib/imoveis/formato'
import { FILTROS_PADRAO, SITUACOES_LANCAMENTO, aplicarAlteracao, montarUrl } from '@/lib/imoveis/filtros'
import type { Cidade, TipoImovel } from '@/lib/imoveis/tipos'
import s from './BuscaInicial.module.css'

type Modo = 'venda' | 'aluguel' | 'lancamentos'

const MODOS: { valor: Modo; rotulo: string }[] = [
  { valor: 'venda', rotulo: 'Comprar' },
  { valor: 'aluguel', rotulo: 'Alugar' },
  { valor: 'lancamentos', rotulo: 'Lançamentos' },
]

function Passo({
  icone,
  rotulo,
  valor,
  max,
  aoMudar,
}: {
  icone: NomeIcone
  rotulo: string
  valor: number
  max: number
  aoMudar: (v: number) => void
}) {
  return (
    <div className={s.passo} role="group" aria-label={`${rotulo} (mínimo)`}>
      <span className={s.passoRotulo}>
        <Icone nome={icone} tamanho={18} />
        {rotulo}
      </span>
      <div className={s.passoControle}>
        <button type="button" aria-label={`Menos ${rotulo.toLowerCase()}`} disabled={valor === 0} onClick={() => aoMudar(valor - 1)}>
          −
        </button>
        <output aria-live="polite">{valor === 0 ? '0' : `${valor}+`}</output>
        <button type="button" aria-label={`Mais ${rotulo.toLowerCase()}`} disabled={valor === max} onClick={() => aoMudar(valor + 1)}>
          +
        </button>
      </div>
    </div>
  )
}

export function BuscaInicial({ cidades }: { cidades: Cidade[] }) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('venda')
  const [tipo, setTipo] = useState<TipoImovel | ''>('')
  const [cidadeSlug, setCidadeSlug] = useState('')
  const [bairroSlug, setBairroSlug] = useState('')
  const [mcmv, setMcmv] = useState(false)
  const [quartos, setQuartos] = useState(0)
  const [banheiros, setBanheiros] = useState(0)
  const [vagas, setVagas] = useState(0)
  const [q, setQ] = useState('')
  const [maisFiltros, setMaisFiltros] = useState(false)
  const idMais = useId()

  const cidade = cidades.find((c) => c.slug === cidadeSlug)
  const aluguel = modo === 'aluguel'
  const ativosMais = [quartos, banheiros, vagas].filter((v) => v > 0).length

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const filtros = aplicarAlteracao(FILTROS_PADRAO, {
      categoria: aluguel ? 'aluguel' : 'venda',
      situacoes: modo === 'lancamentos' ? SITUACOES_LANCAMENTO : [],
      tipos: tipo ? [tipo] : [],
      cidade: cidadeSlug || null,
      bairro: bairroSlug || null,
      mcmv: mcmv && !aluguel,
      quartos,
      banheiros,
      vagas,
      q: q.trim(),
    })
    router.push(montarUrl(filtros))
  }

  return (
    <form className={s.painel} role="search" aria-label="Buscar imóveis" action="/imoveis" onSubmit={buscar}>
      <div className={s.cabecalho}>
        <h2 className={s.titulo}>Encontre seu imóvel</h2>
        <button
          type="button"
          className={s.maisFiltros}
          aria-expanded={maisFiltros}
          aria-controls={idMais}
          onClick={() => setMaisFiltros((v) => !v)}
        >
          <Icone nome="filtros" tamanho={15} />
          {maisFiltros ? 'Menos filtros' : 'Mais filtros'}
          {!maisFiltros && ativosMais > 0 && (
            <span className={s.contagem} aria-label={`${ativosMais} ativo${ativosMais > 1 ? 's' : ''}`}>
              {ativosMais}
            </span>
          )}
        </button>
      </div>

      <div className={s.abas} role="group" aria-label="Negociação">
        {MODOS.map((m) => (
          <button key={m.valor} type="button" aria-pressed={modo === m.valor} onClick={() => setModo(m.valor)}>
            {m.rotulo}
          </button>
        ))}
      </div>

      <div className={s.campos}>
        <label className={s.campo}>
          Tipo de imóvel
          <Seletor
            className={s.escuro}
            aria-label="Tipo de imóvel"
            valor={tipo}
            aoMudar={(v) => setTipo(v as TipoImovel | '')}
            opcoes={[{ valor: '', rotulo: 'Todos' }, ...TIPOS.map((t) => ({ valor: t, rotulo: rotuloTipoPlural[t] }))]}
          />
        </label>
        <label className={s.campo}>
          Cidade
          <Seletor
            className={`${s.escuro} ${s.cidade}`}
            aria-label="Cidade"
            valor={cidadeSlug}
            aoMudar={(v) => {
              setCidadeSlug(v)
              setBairroSlug('')
            }}
            opcoes={[{ valor: '', rotulo: 'Todas' }, ...cidades.map((c) => ({ valor: c.slug, rotulo: c.nome }))]}
          />
        </label>
        <label className={s.campo}>
          Bairro
          <Seletor
            className={`${s.escuro} ${s.bairro}`}
            aria-label="Bairro"
            valor={cidadeSlug && bairroSlug ? `${cidadeSlug}/${bairroSlug}` : ''}
            aoMudar={(v) => {
              const [c, b] = v.split('/')
              if (b) {
                setCidadeSlug(c!)
                setBairroSlug(b)
              } else setBairroSlug('')
            }}
            opcoes={[
              { valor: '', rotulo: 'Todos' },
              ...(cidade ? [cidade] : cidades).map((c) => ({
                rotulo: c.nome,
                opcoes: c.bairros.map((b) => ({ valor: `${c.slug}/${b.slug}`, rotulo: b.nome })),
              })),
            ]}
          />
        </label>

        <div id={idMais} className={`${s.passos} ${s.extra}`} hidden={!maisFiltros}>
          <Passo icone="cama" rotulo="Quartos" valor={quartos} max={4} aoMudar={setQuartos} />
          <Passo icone="banheira" rotulo="Banheiros" valor={banheiros} max={3} aoMudar={setBanheiros} />
          <Passo icone="carro" rotulo="Vagas" valor={vagas} max={3} aoMudar={setVagas} />
        </div>

        <label className={`${s.campo} ${s.extra}`}>
          Empreendimento ou código
          <input
            className={s.codigo}
            type="search"
            name="q"
            enterKeyHint="search"
            placeholder="Ex.: Bela Vista"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <label className={`${s.mcmv} ${s.extra}`} data-desligado={aluguel || undefined}>
          <Image src={logoMcmv} alt="" width={40} height={40} className={s.mcmvLogo} />
          <span>
            <strong>Minha Casa Minha Vida</strong>
            <span>Só imóveis elegíveis ao programa</span>
          </span>
          <input
            type="checkbox"
            className="caixa"
            checked={mcmv && !aluguel}
            disabled={aluguel}
            onChange={(e) => setMcmv(e.target.checked)}
          />
        </label>
      </div>

      <button type="submit" className={`btn btn-sol ${s.buscar}`}>
        <Icone nome="busca" tamanho={22} espessura={2.2} />
        Buscar imóveis
      </button>
    </form>
  )
}
