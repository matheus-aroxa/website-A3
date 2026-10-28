import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao, type LinhaDimensao } from '@/lib/relatorios/audiencia'
import { fmtDec, fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import { listarCidades, listarConstrutoras } from '@/lib/imoveis/repositorio'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { descreverFiltro, rotuloTipoFiltro, type NomesDosFiltros } from '@/lib/relatorios/rotulos'

export default function PaginaBuscas({ searchParams }: PageProps<'/admin/relatorios/buscas'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} arquivo="buscas">
      {(ctx) => <Buscas ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

/** "cidade:recife · quartos:3" → "Cidade: Recife · Quartos: 3+". */
function descreverBusca(chave: string, nomes: NomesDosFiltros) {
  return chave
    .split(' · ')
    .map((f) => {
      const d = /^[a-z]+:/.test(f) ? descreverFiltro(f, nomes) : null
      return d ? `${d.tipo}: ${d.valor}` : f
    })
    .join(' · ')
}

/** Os filtros mais usados de um tipo (ex.: as cidades), com os nomes em vez dos códigos. */
function ranking(usos: LinhaDimensao[], tipo: string, nomes: NomesDosFiltros, limite = 8) {
  return usos
    .filter((u) => u.chave.startsWith(`${tipo}:`))
    .slice(0, limite)
    .map((u) => ({ rotulo: descreverFiltro(u.chave, nomes).valor, valor: u.eventos, sessoes: u.sessoes }))
}

async function Buscas({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [usos, totais, termos, vazias, acoes, cidades, construtoras] = await Promise.all([
    porDimensao(periodo, 'busca-uso', { ordem: 'eventos', limite: 400 }),
    porDimensao(periodo, 'busca', { ordem: 'eventos' }),
    porDimensao(periodo, 'busca-termo', { ordem: 'eventos', limite: 50 }),
    porDimensao(periodo, 'busca-vazia', { ordem: 'eventos', limite: 50 }),
    porDimensao(periodo, 'acao', { ordem: 'eventos', limite: 300 }),
    listarCidades(),
    listarConstrutoras(),
  ])
  const nomes: NomesDosFiltros = {
    cidades: new Map(cidades.map((c) => [c.slug, c.nome])),
    bairros: new Map(cidades.flatMap((c) => c.bairros.map((b) => [b.slug, `${b.nome} (${c.nome})`] as const))),
    construtoras: new Map(construtoras.map((c) => [c.slug, c.nome])),
  }
  const total = totais.find((t) => t.chave === 'total')
  const buscas = total?.eventos ?? 0
  const semResultado = totais.find((t) => t.chave === 'sem-resultado')?.eventos ?? 0
  const filtrosPorBusca = razao(usos.reduce((a, u) => a + u.eventos, 0), buscas)
  const carregarMais = acoes.filter((a) => a.chave === 'acao:carregar-mais').reduce((a, b) => a + b.eventos, 0)
  const nada = <Vazio titulo="Nenhuma busca com filtro neste período" texto="Conta quando alguém aplica pelo menos um filtro (categoria, cidade, quartos, construtora...)." />

  const porTipoDeFiltro = new Map<string, number>()
  for (const u of usos) {
    const t = u.chave.split(':')[0]!
    porTipoDeFiltro.set(t, (porTipoDeFiltro.get(t) ?? 0) + u.eventos)
  }
  const tiposDeFiltro = [...porTipoDeFiltro].sort((a, b) => b[1] - a[1])

  const listas: { titulo: string; tipo: string; descricao?: string }[] = [
    { titulo: 'Cidades procuradas', tipo: 'cidade' },
    { titulo: 'Bairros procurados', tipo: 'bairro' },
    { titulo: 'Tipos de imóvel', tipo: 'tipo' },
    { titulo: 'Fase da obra', tipo: 'situacao' },
    { titulo: 'Quartos', tipo: 'quartos', descricao: 'Mínimo de quartos pedido.' },
    { titulo: 'Construtoras', tipo: 'construtora' },
    { titulo: 'Venda ou aluguel', tipo: 'categoria' },
    { titulo: 'Ordenação', tipo: 'ordem' },
  ]

  return (
    <>
      <GradeKpi
        titulo="Indicadores de busca"
        itens={[
          { rotulo: 'Buscas com filtro', valor: fmtInt(buscas) },
          { rotulo: 'Sem resultado', valor: fmtPct(razao(semResultado, buscas)) },
          { rotulo: 'Filtros por busca', valor: fmtDec(filtrosPorBusca) },
          { rotulo: 'Termos digitados', valor: fmtInt(termos.reduce((a, t) => a + t.eventos, 0)) },
        ]}
      >
        <Kpi rotulo="Buscas com filtro" valor={fmtInt(buscas)} nota={total ? `${fmtInt(total.sessoes)} sessões` : undefined} />
        <Kpi rotulo="Buscas sem resultado" valor={fmtPct(razao(semResultado, buscas))} nota={`${fmtInt(semResultado)} de ${fmtInt(buscas)}`} />
        <Kpi rotulo="Filtros por busca" valor={fmtDec(filtrosPorBusca)} nota="Média de filtros aplicados" />
        <Kpi rotulo="Termos digitados" valor={fmtInt(termos.reduce((a, t) => a + t.eventos, 0))} nota="Texto livre no campo de busca" />
        <Kpi rotulo="“Carregar mais”" valor={fmtInt(carregarMais)} nota="Cliques para ver mais resultados" />
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Buscas sem resultado"
          descricao="O que as pessoas procuraram e o site não tem. É a lista de captação: imóveis que valem a pena buscar."
          tabela={<TabelaDados legenda="Buscas sem resultado" colunas={[{ id: 'busca', titulo: 'Busca' }, { id: 'vezes', titulo: 'Vezes', numerica: true }]} linhas={vazias.map((v) => ({ busca: descreverBusca(v.chave, nomes), vezes: v.eventos }))} ordem={{ coluna: 'vezes', decrescente: true }} />}
        >
          {vazias.length ? (
            <Barras
              itens={vazias.slice(0, 10).map((v) => ({ rotulo: descreverBusca(v.chave, nomes), valor: v.eventos }))}
              formato={fmtInt}
              cor="var(--g-2)"
            />
          ) : <Vazio titulo="Nenhuma busca ficou sem resultado" texto="Todas as combinações de filtro pesquisadas tinham imóveis." />}
        </Cartao>
        <Cartao
          titulo="Termos digitados"
          descricao="Texto livre procurado no campo de busca."
          tabela={<TabelaDados legenda="Termos digitados" colunas={[{ id: 'termo', titulo: 'Termo' }, { id: 'vezes', titulo: 'Vezes', numerica: true }]} linhas={termos.map((t) => ({ termo: t.chave, vezes: t.eventos }))} ordem={{ coluna: 'vezes', decrescente: true }} />}
        >
          {termos.length ? <Barras itens={termos.slice(0, 10).map((t) => ({ rotulo: t.chave, valor: t.eventos }))} formato={fmtInt} /> : <Vazio titulo="Nenhum termo digitado" />}
        </Cartao>
      </div>

      <Cartao
        titulo="Filtros mais usados"
        descricao="Quantas buscas usaram cada tipo de filtro."
        tabela={<TabelaDados legenda="Uso por tipo de filtro" colunas={[{ id: 'filtro', titulo: 'Filtro' }, { id: 'usos', titulo: 'Buscas', numerica: true }]} linhas={tiposDeFiltro.map(([t, n]) => ({ filtro: rotuloTipoFiltro[t] ?? t, usos: n }))} ordem={{ coluna: 'usos', decrescente: true }} />}
      >
        {tiposDeFiltro.length ? <Barras itens={tiposDeFiltro.map(([t, n]) => ({ rotulo: rotuloTipoFiltro[t] ?? t, valor: n, extras: [['Das buscas', fmtPct(razao(n, buscas))]] }))} formato={fmtInt} /> : nada}
      </Cartao>

      <div className={s.grade} data-colunas="3">
        {listas.map((l) => {
          const itens = ranking(usos, l.tipo, nomes, 10)
          return (
            <Cartao
              key={l.tipo}
              titulo={l.titulo}
              descricao={l.descricao}
              tabela={<TabelaDados legenda={l.titulo} colunas={[{ id: 'item', titulo: 'Item' }, { id: 'buscas', titulo: 'Buscas', numerica: true }]} linhas={itens.map((i) => ({ item: i.rotulo, buscas: i.valor }))} ordem={{ coluna: 'buscas', decrescente: true }} />}
            >
              {itens.length ? <Barras itens={itens.map((i) => ({ rotulo: i.rotulo, valor: i.valor }))} formato={fmtInt} /> : <Vazio titulo="Sem dados" />}
            </Cartao>
          )
        })}
      </div>
    </>
  )
}
