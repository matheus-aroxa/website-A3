'use client'

import { useEffect, useState } from 'react'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { Icone } from '@/components/ui/Icone'
import { pluralImoveis } from '@/lib/imoveis/formato'
import { chipsAtivos } from '@/lib/imoveis/filtros'
import type { ImovelResumo } from '@/lib/imoveis/tipos'
import { linkWhatsApp } from '@/lib/site'
import { useBusca } from './ContextoBusca'
import s from './Busca.module.css'

/** Esmaece os resultados enquanto o servidor responde a uma troca de filtro. */
export function AreaResultados({ children }: { children: React.ReactNode }) {
  const { pendente } = useBusca()
  return (
    <div id="resultados" className={s.resultados} data-pendente={pendente || undefined} aria-busy={pendente}>
      {children}
    </div>
  )
}

export function ResumoResultados({ total }: { total: number }) {
  const { filtros, cidades, construtoras, aplicar, limpar, registrarTotal } = useBusca()
  const chips = chipsAtivos(filtros, cidades, construtoras)

  useEffect(() => registrarTotal(total), [total, registrarTotal])

  return (
    <div className={s.resumo}>
      <p className={s.total} aria-live="polite">
        <strong>{chips.length ? `${pluralImoveis(total)} ${total === 1 ? 'encontrado' : 'encontrados'}` : `${pluralImoveis(total)} disponíveis`}</strong>
      </p>
      {chips.length > 0 && (
        <div className={s.chips}>
          {chips.map((c) => (
            <button key={c.chave} type="button" className={s.chip} onClick={() => aplicar(c.remover)} aria-label={`Remover filtro ${c.rotulo}`}>
              {c.rotulo}
              <Icone nome="fechar" tamanho={16} espessura={2.2} />
            </button>
          ))}
          <button type="button" className={s.limparTudo} onClick={limpar}>
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}

export function SemResultados() {
  const { limpar } = useBusca()
  return (
    <div className={s.vazio}>
      <span className={s.vazioIcone}>
        <Icone nome="busca" tamanho={26} espessura={2} />
      </span>
      <h2>Nenhum imóvel com esses filtros</h2>
      <p>
        Tente remover algum filtro — ou fale com um corretor, que ele busca para você entre os imóveis que ainda não estão
        no site.
      </p>
      <div className={s.vazioAcoes}>
        <button type="button" className="btn btn-mar btn-quadrado" onClick={limpar}>
          Limpar filtros
        </button>
        <a
          className="btn btn-linha btn-quadrado"
          href={linkWhatsApp('Olá! Não encontrei no site o imóvel que procuro. Podem me ajudar?')}
          target="_blank"
          rel="noopener"
        >
          Falar com um corretor
        </a>
      </div>
    </div>
  )
}

/**
 * No celular, "Carregar mais" acrescenta a próxima página na mesma lista (como no protótipo).
 * Sem JavaScript, ou para robôs, é um link comum para ?pagina=N+1.
 */
export function CarregarMais({
  urlProxima,
  apiProxima,
  exibidos,
  total,
}: {
  urlProxima: string | null
  apiProxima: string | null
  exibidos: number
  total: number
}) {
  const [extras, setExtras] = useState<ImovelResumo[]>([])
  const [proxima, setProxima] = useState({ url: urlProxima, api: apiProxima })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)

  async function carregar(e: React.MouseEvent) {
    if (!proxima.api || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    setCarregando(true)
    setErro(false)
    try {
      const resposta = await fetch(proxima.api)
      if (!resposta.ok) throw new Error(String(resposta.status))
      const dados: { itens: ImovelResumo[]; proxima: { url: string; api: string } | null } = await resposta.json()
      setExtras((atuais) => [...atuais, ...dados.itens])
      setProxima(dados.proxima ?? { url: null, api: null })
    } catch {
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  const mostrando = exibidos + extras.length
  return (
    <>
      {extras.length > 0 && (
        <div className={s.grade}>
          {extras.map((im) => (
            <CardImovel key={im.id} imovel={im} nivelTitulo={2} />
          ))}
        </div>
      )}
      {proxima.url && (
        <div className={s.carregarMais}>
          <a href={proxima.url} className="btn btn-linha btn-quadrado btn-bloco" style={{ height: 54, fontSize: 16 }} onClick={carregar} aria-busy={carregando}>
            {carregando ? 'Carregando…' : 'Carregar mais imóveis'}
          </a>
          <p>{erro ? 'Não foi possível carregar. Toque para tentar de novo.' : `Mostrando ${mostrando} de ${total}`}</p>
        </div>
      )}
    </>
  )
}
