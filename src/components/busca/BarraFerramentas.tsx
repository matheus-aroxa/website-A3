'use client'

import { useState } from 'react'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import { chipsAtivos, ORDENS, type Ordem } from '@/lib/imoveis/filtros'
import { useBusca } from './ContextoBusca'
import { useAdiado } from './useAdiado'
import s from './Busca.module.css'

export function BarraFerramentas() {
  const { filtros, cidades, aplicar, setPainelAberto } = useBusca()
  const [texto, setTexto] = useState(filtros.q)
  const nAtivos = chipsAtivos(filtros, cidades).filter((c) => c.chave !== 'q').length

  // Sincroniza o campo quando a busca muda por fora (chip removido, "Limpar tudo"),
  // sem atropelar o que a pessoa continua digitando.
  const [qAnterior, setQAnterior] = useState(filtros.q)
  if (filtros.q !== qAnterior) {
    setQAnterior(filtros.q)
    if (filtros.q === '' || !texto.startsWith(filtros.q)) setTexto(filtros.q)
  }

  const [aplicarBusca, cancelarBusca] = useAdiado((q: string) => aplicar({ q }), 450)

  function digitar(valor: string) {
    setTexto(valor)
    aplicarBusca(valor)
  }

  return (
    <form
      role="search"
      className={s.barra}
      onSubmit={(e) => {
        e.preventDefault()
        cancelarBusca()
        aplicar({ q: texto })
      }}
    >
      <label className={s.campoBusca}>
        <span className="sr-only">Buscar por nome ou código do imóvel</span>
        <Icone nome="busca" espessura={2} />
        <input
          className="campo"
          type="search"
          name="q"
          enterKeyHint="search"
          value={texto}
          onChange={(e) => digitar(e.target.value)}
          placeholder="Nome ou código (ex.: VEM_37819)"
        />
      </label>
      <div className={s.barraAcoes}>
        <button
          type="button"
          className={s.botaoFiltros}
          onClick={() => setPainelAberto(true)}
          aria-controls="painel-filtros"
        >
          <Icone nome="filtros" />
          Filtros
          {nAtivos > 0 && <span className={s.contador}>{nAtivos}</span>}
        </button>
        <label className={s.ordenar}>
          <span className={s.ordenarRotulo}>Ordenar por</span>
          <Seletor
            valor={filtros.ordem}
            aoMudar={(v) => aplicar({ ordem: v as Ordem })}
            aria-label="Ordenar por"
            opcoes={ORDENS.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))}
          />
        </label>
      </div>
    </form>
  )
}
