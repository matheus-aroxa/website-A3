import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BarraFerramentas } from '@/components/busca/BarraFerramentas'
import { ProvedorBusca } from '@/components/busca/ContextoBusca'
import { PainelFiltros } from '@/components/busca/PainelFiltros'
import { AreaResultados } from '@/components/busca/Resultados'
import { BotaoWhatsApp } from '@/components/layout/BotaoWhatsApp'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { Migalhas } from '@/components/ui/Migalhas'
import { interpretarSegmentos, segmentosDaRota } from '@/lib/imoveis/filtros'
import { listarCidades, listarIndice } from '@/lib/imoveis/repositorio'
import { combinacoesDeRota, migalhasDaBusca, textosDaBusca } from '@/lib/imoveis/rotas'
import s from '@/components/busca/Busca.module.css'

// Pré-gera todas as páginas de busca que têm imóveis (categoria × tipo × cidade × bairro).
// Combinações novas que surgirem no CRM são geradas no primeiro acesso e ficam em cache.
export async function generateStaticParams() {
  const imoveis = await listarIndice()
  return combinacoesDeRota(imoveis).map((rota) => ({ filtros: segmentosDaRota(rota) }))
}

export default async function LayoutBusca({ params, children }: LayoutProps<'/imoveis/[[...filtros]]'>) {
  const [{ filtros: segmentos }, cidades] = await Promise.all([params, listarCidades()])
  const rota = interpretarSegmentos(segmentos, cidades)
  if (!rota) notFound()
  const { h1, subtitulo } = textosDaBusca(rota, cidades)

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <main id="conteudo">
        <section className={s.topo}>
          <div className={`container ${s.titulos}`}>
            <Migalhas itens={migalhasDaBusca(rota, cidades)} />
            <h1>{h1}</h1>
            <p>{subtitulo}</p>
          </div>
        </section>

        {/* Filtros dependem da query (?quartos=2...), então chegam por streaming logo após o shell. */}
        <Suspense fallback={<EsqueletoBusca />}>
          <ProvedorBusca rota={rota} cidades={cidades}>
            <div className={s.topoBarra}>
              <div className="container">
                <BarraFerramentas />
              </div>
            </div>
            <section className={s.corpo} aria-label="Resultados da busca">
              <div className={`container ${s.corpoGrade}`}>
                <PainelFiltros />
                <AreaResultados>{children}</AreaResultados>
              </div>
            </section>
          </ProvedorBusca>
        </Suspense>
      </main>
      <Rodape />
      <BotaoWhatsApp />
    </>
  )
}

function EsqueletoBusca() {
  return (
    <>
      <div className={s.topoBarra}>
        <div className="container">
          <div className={s.esqueleto} style={{ height: 52, borderRadius: 12 }} />
        </div>
      </div>
      <section className={s.corpo} aria-hidden="true">
        <div className={`container ${s.corpoGrade}`}>
          <div className={`${s.painel} ${s.esqueleto}`} style={{ height: 640 }} />
          <div className={s.resultados}>
            <div className={s.esqueleto} style={{ height: 36, width: 220 }} />
            <div className={s.grade}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={s.esqueleto} style={{ height: 420 }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
