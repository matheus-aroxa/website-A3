'use client'

// Painel de filtros flutuante da home. Monta a mesma URL que o painel de filtros da busca
// (ex.: /imoveis/venda/apartamentos/paulista/jaguaribe?quartos=2) e navega até ela.
// Sem JavaScript o formulário ainda funciona: envia ?q= para /imoveis.

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
    <div className={s.passo} role="group" aria-label={`${rotulo} (mínimo)`} title={`${rotulo} (mínimo)`}>
      <Icone nome={icone} tamanho={20} />
      <span className={s.passoRotulo}>{rotulo}</span>
      <button type="button" aria-label={`Menos ${rotulo.toLowerCase()}`} disabled={valor === 0} onClick={() => aoMudar(valor - 1)}>
        −
      </button>
      <output aria-live="polite">{valor === 0 ? '0' : `${valor}+`}</output>
      <button type="button" aria-label={`Mais ${rotulo.toLowerCase()}`} disabled={valor === max} onClick={() => aoMudar(valor + 1)}>
        +
      </button>
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
  const [expandido, setExpandido] = useState(false) // só importa no celular

  const cidade = cidades.find((c) => c.slug === cidadeSlug)
  const aluguel = modo === 'aluguel'

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
    <form
      className={s.painel}
      role="search"
      aria-label="Buscar imóveis"
      action="/imoveis"
      data-expandido={expandido || undefined}
      onSubmit={buscar}
    >
      <div className={s.linha}>
        <Seletor
          className={s.campoEscuro}
          aria-label="Negociação"
          valor={modo}
          aoMudar={(v) => setModo(v as Modo)}
          opcoes={MODOS.map((m) => ({ valor: m.valor, rotulo: m.rotulo }))}
        />
        <Seletor
          className={s.campoEscuro}
          aria-label="Tipo de imóvel"
          valor={tipo}
          aoMudar={(v) => setTipo(v as TipoImovel | '')}
          opcoes={[{ valor: '', rotulo: 'Tipo' }, ...TIPOS.map((t) => ({ valor: t, rotulo: rotuloTipoPlural[t] }))]}
        />
        <Seletor
          className={s.campoEscuro}
          aria-label="Cidade"
          valor={cidadeSlug}
          aoMudar={(v) => {
            setCidadeSlug(v)
            setBairroSlug('')
          }}
          opcoes={[{ valor: '', rotulo: 'Cidade' }, ...cidades.map((c) => ({ valor: c.slug, rotulo: c.nome }))]}
        />
        <Seletor
          className={s.campoEscuro}
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
            { valor: '', rotulo: 'Bairro' },
            ...(cidade ? [cidade] : cidades).map((c) => ({
              rotulo: c.nome,
              opcoes: c.bairros.map((b) => ({ valor: `${c.slug}/${b.slug}`, rotulo: b.nome })),
            })),
          ]}
        />
        <label className={s.mcmv} data-desligado={aluguel || undefined}>
          <Image src={logoMcmv} alt="" width={40} height={40} className={s.mcmvLogo} />
          <span>Minha Casa Minha Vida</span>
          <input
            type="checkbox"
            className="caixa"
            checked={mcmv && !aluguel}
            disabled={aluguel}
            onChange={(e) => setMcmv(e.target.checked)}
          />
        </label>
      </div>

      <div className={`${s.linha} ${s.linhaExtra}`}>
        <Passo icone="cama" rotulo="Quartos" valor={quartos} max={4} aoMudar={setQuartos} />
        <Passo icone="banheira" rotulo="Banheiros" valor={banheiros} max={3} aoMudar={setBanheiros} />
        <Passo icone="carro" rotulo="Vagas" valor={vagas} max={3} aoMudar={setVagas} />
        <input
          className={s.codigo}
          type="search"
          name="q"
          enterKeyHint="search"
          aria-label="Buscar por empreendimento ou código"
          placeholder="Empreendimento ou código"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <button type="button" className={s.maisFiltros} aria-expanded={expandido} onClick={() => setExpandido((v) => !v)}>
        {expandido ? 'Menos filtros' : 'Mais filtros'}
      </button>

      <button type="submit" className={`btn btn-sol ${s.buscar}`}>
        <Icone nome="busca" tamanho={20} espessura={2.2} />
        Buscar
      </button>
    </form>
  )
}
