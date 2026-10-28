import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { listarConstrutorasAdmin } from '@/lib/imoveis/construtoras'
import { resumoDoCatalogo } from '@/lib/relatorios/catalogo'
import { fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import { agruparImoveis, desempenhoDosImoveis } from '@/lib/relatorios/imoveis'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'

export default function PaginaConstrutoras({ searchParams }: PageProps<'/admin/relatorios/construtoras'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} arquivo="construtoras">
      {(ctx) => <Construtoras ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const MIN_SESSOES = 30

async function Construtoras({ ctx }: { ctx: ContextoDoRelatorio }) {
  const [imoveis, resumo, cadastradas] = await Promise.all([desempenhoDosImoveis(ctx.periodo), resumoDoCatalogo(), listarConstrutorasAdmin()])
  const grupos = agruparImoveis(imoveis, (i) => (i.status === 'ativo' ? i.construtora : null))
  const reais = grupos.filter((g) => g.chave !== 'Não informado')
  const naoInformado = grupos.find((g) => g.chave === 'Não informado')
  const semImoveis = cadastradas.filter((c) => !c.padrao && c.imoveis === 0)
  const porImoveis = [...reais].sort((a, b) => b.imoveis - a.imoveis || a.chave.localeCompare(b.chave, 'pt-BR'))
  const maisVistas = [...reais].filter((g) => g.visitas > 0).sort((a, b) => b.visitas - a.visitas).slice(0, 12)
  const melhorTaxa = [...reais].filter((g) => g.sessoes >= MIN_SESSOES && g.conversoes > 0).sort((a, b) => razao(b.conversoes, b.sessoes) - razao(a.conversoes, a.sessoes)).slice(0, 12)
  const taxaGeral = razao(grupos.reduce((a, g) => a + g.conversoes, 0), grupos.reduce((a, g) => a + g.sessoes, 0))
  const lider = porImoveis[0]

  return (
    <>
      <GradeKpi
        titulo="Indicadores das construtoras"
        itens={[
          { rotulo: 'Construtoras cadastradas', valor: fmtInt(resumo.construtoras.total) },
          { rotulo: 'Com imóveis ativos', valor: fmtInt(resumo.construtoras.comImoveis) },
          { rotulo: 'Sem imóveis', valor: fmtInt(semImoveis.length) },
          { rotulo: 'Imóveis sem construtora informada', valor: fmtInt(resumo.construtoras.imoveisNaoInformados) },
        ]}
      >
        <Kpi rotulo="Cadastradas" valor={fmtInt(resumo.construtoras.total)} nota="Sem contar “Não informado”" />
        <Kpi rotulo="Com imóveis ativos" valor={fmtInt(resumo.construtoras.comImoveis)} nota={lider ? `${lider.chave} lidera, com ${fmtInt(lider.imoveis)}` : undefined} />
        <Kpi rotulo="Sem imóveis" valor={fmtInt(semImoveis.length)} nota="Cadastradas e sem nenhum imóvel ativo" />
        <Kpi rotulo="Imóveis “Não informado”" valor={fmtInt(resumo.construtoras.imoveisNaoInformados)} nota={naoInformado ? `${fmtPct(razao(resumo.construtoras.imoveisNaoInformados, resumo.imoveis.ativos), 0)} dos imóveis ativos` : undefined} />
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Imóveis por construtora"
          descricao="As 15 construtoras com mais imóveis ativos."
          tabela={undefined}
        >
          <Barras itens={porImoveis.slice(0, 15).map((g) => ({ rotulo: g.chave, valor: g.imoveis }))} formato={fmtInt} />
        </Cartao>
        <Cartao
          titulo="Construtoras mais vistas"
          descricao="Visitas somadas aos imóveis de cada construtora no período."
          tabela={undefined}
        >
          {maisVistas.length ? <Barras itens={maisVistas.map((g) => ({ rotulo: g.chave, sub: `${fmtInt(g.imoveis)} imóveis · ${razao(g.visitas, g.imoveis).toFixed(1).replace('.', ',')} visitas por imóvel`, valor: g.visitas, extras: [['Contatos', fmtInt(g.contatos)]] }))} formato={fmtInt} /> : <Vazio titulo="Sem visitas neste período" />}
        </Cartao>
      </div>

      <Cartao
        titulo="Desempenho de cada construtora"
        descricao="Visitas e contatos no período. Clique no cabeçalho para ordenar."
        tabela={undefined}
      >
        <TabelaDados
          legenda="Desempenho das construtoras"
          buscar
          limite={15}
          colunas={[
            { id: 'construtora', titulo: 'Construtora' },
            { id: 'imoveis', titulo: 'Imóveis', numerica: true },
            { id: 'visitas', titulo: 'Visitas', numerica: true },
            { id: 'porImovel', titulo: 'Visitas por imóvel', numerica: true },
            { id: 'sessoes', titulo: 'Sessões', numerica: true },
            { id: 'contatos', titulo: 'Contatos', numerica: true },
            { id: 'taxa', titulo: 'Taxa de contato', numerica: true },
          ]}
          linhas={grupos.map((g) => ({
            construtora: g.chave,
            imoveis: g.imoveis,
            visitas: g.visitas,
            porImovel: { v: razao(g.visitas, g.imoveis), t: razao(g.visitas, g.imoveis).toFixed(1).replace('.', ',') },
            sessoes: g.sessoes,
            contatos: g.contatos,
            taxa: { v: razao(g.conversoes, g.sessoes), t: g.sessoes ? fmtPct(razao(g.conversoes, g.sessoes)) : '—' },
          }))}
          ordem={{ coluna: 'imoveis', decrescente: true }}
        />
      </Cartao>

      <div className={s.grade}>
        <Cartao
          titulo="Maior taxa de contato"
          descricao={`Construtoras em que mais sessões terminaram em contato (a partir de ${MIN_SESSOES} sessões). A média do site é ${fmtPct(taxaGeral)}.`}
          tabela={undefined}
        >
          {melhorTaxa.length ? <Barras itens={melhorTaxa.map((g) => ({ rotulo: g.chave, sub: `${fmtInt(g.conversoes)} de ${fmtInt(g.sessoes)} sessões`, valor: razao(g.conversoes, g.sessoes), texto: fmtPct(razao(g.conversoes, g.sessoes)) }))} formato={(n) => fmtPct(n)} /> : <Vazio titulo="Sessões insuficientes" texto={`Nenhuma construtora chegou a ${MIN_SESSOES} sessões com contato no período.`} />}
        </Cartao>
        <Cartao
          titulo="Construtoras sem imóveis"
          descricao="Cadastradas, mas sem nenhum imóvel ativo. Podem ser excluídas na tela Construtoras, se não forem mais usadas."
          tabela={undefined}
        >
          {semImoveis.length ? (
            <TabelaDados legenda="Construtoras sem imóveis" limite={10} colunas={[{ id: 'nome', titulo: 'Construtora' }]} linhas={semImoveis.map((c) => ({ nome: { v: c.nome, href: '/admin/construtoras' } }))} ordem={{ coluna: 'nome' }} />
          ) : <Vazio titulo="Toda construtora cadastrada tem imóveis" />}
        </Cartao>
      </div>
    </>
  )
}
