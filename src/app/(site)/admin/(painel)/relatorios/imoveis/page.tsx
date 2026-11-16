import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados, type LinhaDaTabela } from '@/components/admin/relatorios/Tabela'
import { porDimensao } from '@/lib/relatorios/audiencia'
import { fmtDuracao, fmtInt, fmtMoeda, fmtPct, razao } from '@/lib/relatorios/formato'
import { agruparImoveis, contatosDe, desempenhoDosImoveis, faixaDePreco, FAIXAS_DE_PRECO, type DesempenhoImovel, type GrupoDeImoveis } from '@/lib/relatorios/imoveis'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { rotuloLista } from '@/lib/relatorios/rotulos'
import { rotuloSituacao, rotuloTipo } from '@/lib/imoveis/formato'
import type { Situacao, TipoImovel } from '@/lib/imoveis/tipos'

export default function PaginaImoveis({ searchParams }: PageProps<'/admin/relatorios/imoveis'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams}>
      {(ctx) => <Imoveis ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const taxa = (i: DesempenhoImovel) => razao(i.conversoes, i.sessoes)
const MIN_SESSOES_TAXA = 20
const MIN_SESSOES_OPORTUNIDADE = 15

async function Imoveis({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [imoveis, acoes] = await Promise.all([desempenhoDosImoveis(periodo), porDimensao(periodo, 'acao', { ordem: 'eventos', limite: 500 })])
  const ativos = imoveis.filter((i) => i.status === 'ativo')
  const visitados = ativos.filter((i) => i.visitas > 0)
  const semVisita = ativos.filter((i) => i.visitas === 0)
  const totalSessoes = imoveis.reduce((a, i) => a + i.sessoes, 0)
  const totalConversoes = imoveis.reduce((a, i) => a + i.conversoes, 0)
  const taxaGeral = razao(totalConversoes, totalSessoes)
  const temDados = totalSessoes > 0
  const oportunidades = ativos.filter((i) => i.sessoes >= MIN_SESSOES_OPORTUNIDADE && taxa(i) < taxaGeral / 2).sort((a, b) => b.sessoes - a.sessoes)
  const link = (i: DesempenhoImovel) => (i.slug ? `/imovel/${i.slug}` : undefined)
  const local = (i: DesempenhoImovel) => `${i.bairro}, ${i.cidade}`
  const nada = <Vazio titulo="Sem visitas a imóveis neste período" />

  const maisVistos = [...imoveis].filter((i) => i.visitas > 0).sort((a, b) => b.visitas - a.visitas).slice(0, 15)
  const maisContatos = [...imoveis].filter((i) => contatosDe(i) > 0).sort((a, b) => contatosDe(b) - contatosDe(a) || b.visitas - a.visitas).slice(0, 15)
  const maiorTaxa = [...imoveis].filter((i) => i.sessoes >= MIN_SESSOES_TAXA && i.conversoes > 0).sort((a, b) => taxa(b) - taxa(a)).slice(0, 12)

  const todos: LinhaDaTabela[] = imoveis.map((i) => {
    const sinal = i.status === null ? 'Excluído' : i.status !== 'ativo' ? 'Desativado' : i.visitas === 0 ? 'Sem visitas' : i.sessoes >= MIN_SESSOES_OPORTUNIDADE && taxa(i) < taxaGeral / 2 ? 'Pouco contato' : ''
    return {
      imovel: { v: i.nome, href: i.status ? `/admin/imoveis/${i.id}` : undefined },
      cidade: `${i.bairro}, ${i.cidade}`,
      construtora: i.construtora,
      preco: i.preco === null ? null : { v: i.preco, t: fmtMoeda(i.preco) },
      visitas: i.visitas,
      visitantes: i.visitantes,
      tempo: { v: i.tempoMedio, t: i.visitas ? fmtDuracao(i.tempoMedio) : '—' },
      rolagem: { v: i.rolagemMedia, t: i.visitas ? `${Math.round(i.rolagemMedia)}%` : '—' },
      fotos: i.galeria,
      contatos: contatosDe(i),
      taxa: { v: taxa(i), t: i.sessoes ? fmtPct(taxa(i)) : '—' },
      sinal: sinal ? { v: sinal, tom: sinal === 'Pouco contato' || sinal === 'Sem visitas' ? 'atencao' : 'etiqueta' } : '',
    }
  })

  const grupos: { titulo: string; descricao: string; itens: GrupoDeImoveis[]; rotulo?: (c: string) => string }[] = [
    { titulo: 'Por faixa de preço', descricao: 'Imóveis à venda.', itens: FAIXAS_DE_PRECO.map((f) => agruparImoveis(imoveis, (i) => (faixaDePreco(i) === f.rotulo ? f.rotulo : null))[0] ?? { chave: f.rotulo, imoveis: 0, visitas: 0, visitantes: 0, sessoes: 0, conversoes: 0, contatos: 0 }) },
    { titulo: 'Por fase da obra', descricao: 'Lançamento, em construção ou pronto.', itens: agruparImoveis(imoveis, (i) => (i.situacao ? rotuloSituacao[i.situacao as Situacao] : null)) },
    { titulo: 'Por tipo de imóvel', descricao: 'Apartamento, casa ou terreno.', itens: agruparImoveis(imoveis, (i) => (i.tipo ? rotuloTipo[i.tipo as TipoImovel] : null)) },
    { titulo: 'Por cidade', descricao: 'Onde ficam os imóveis mais procurados.', itens: agruparImoveis(imoveis, (i) => (i.status ? i.cidade : null)).sort((a, b) => b.visitas - a.visitas).slice(0, 12) },
    { titulo: 'Por construtora', descricao: 'Interesse por construtora.', itens: agruparImoveis(imoveis, (i) => (i.status ? i.construtora : null)).sort((a, b) => b.visitas - a.visitas).slice(0, 12) },
  ]
  const origemDosCliques = acoes.filter((a) => a.chave.startsWith('card:')).reduce<Record<string, number>>((m, a) => ({ ...m, [a.chave.slice(5)]: (m[a.chave.slice(5)] ?? 0) + a.eventos }), {})

  return (
    <>
      <GradeKpi>
        <Kpi rotulo="Imóveis visitados" valor={fmtInt(visitados.length)} nota={`de ${fmtInt(ativos.length)} ativos (${fmtPct(razao(visitados.length, ativos.length), 0)})`} />
        <Kpi rotulo="Sem nenhuma visita" valor={fmtInt(semVisita.length)} nota="Ativos que ninguém abriu no período" />
        <Kpi rotulo="Visitas por imóvel" valor={temDados ? (visitados.reduce((a, i) => a + i.visitas, 0) / Math.max(1, visitados.length)).toFixed(1).replace('.', ',') : '—'} nota="Média entre os visitados" />
        <Kpi rotulo="Taxa de contato" valor={fmtPct(taxaGeral)} nota="Sessões no imóvel que viraram contato sobre ele" />
        <Kpi rotulo="Muita visita, pouco contato" valor={fmtInt(oportunidades.length)} nota={`Ao menos ${MIN_SESSOES_OPORTUNIDADE} sessões e menos da metade da taxa média`} />
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Mais vistos"
          descricao="Páginas vistas no período."
          tabela={<TabelaDados legenda="Imóveis mais vistos" limite={15} colunas={[{ id: 'imovel', titulo: 'Imóvel' }, { id: 'local', titulo: 'Local' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={maisVistos.map((i) => ({ imovel: i.nome, local: local(i), visitas: i.visitas, contatos: contatosDe(i) }))} ordem={{ coluna: 'visitas', decrescente: true }} />}
        >
          {maisVistos.length ? <Barras itens={maisVistos.map((i) => ({ rotulo: i.nome, sub: local(i), href: link(i), valor: i.visitas, extras: [['Visitantes', fmtInt(i.visitantes)], ['Contatos', fmtInt(contatosDe(i))]] }))} formato={fmtInt} /> : nada}
        </Cartao>
        <Cartao
          titulo="Mais contatos"
          descricao="WhatsApp e formulários enviados a partir da página do imóvel."
          tabela={<TabelaDados legenda="Imóveis com mais contatos" limite={15} colunas={[{ id: 'imovel', titulo: 'Imóvel' }, { id: 'whatsapp', titulo: 'WhatsApp', numerica: true }, { id: 'formulario', titulo: 'Formulário', numerica: true }, { id: 'total', titulo: 'Total', numerica: true }]} linhas={maisContatos.map((i) => ({ imovel: i.nome, whatsapp: i.whatsapp, formulario: i.formulario, total: contatosDe(i) }))} ordem={{ coluna: 'total', decrescente: true }} />}
        >
          {maisContatos.length ? <Barras itens={maisContatos.map((i) => ({ rotulo: i.nome, sub: local(i), href: link(i), valor: contatosDe(i), extras: [['WhatsApp', fmtInt(i.whatsapp)], ['Formulário', fmtInt(i.formulario)]] }))} formato={fmtInt} /> : <Vazio titulo="Nenhum contato registrado neste período" />}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Maior taxa de contato"
          descricao={`Imóveis em que mais sessões terminaram em contato (a partir de ${MIN_SESSOES_TAXA} sessões).`}
          tabela={<TabelaDados legenda="Maior taxa de contato" colunas={[{ id: 'imovel', titulo: 'Imóvel' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Com contato', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={maiorTaxa.map((i) => ({ imovel: i.nome, sessoes: i.sessoes, contatos: i.conversoes, taxa: { v: taxa(i), t: fmtPct(taxa(i)) } }))} ordem={{ coluna: 'taxa', decrescente: true }} />}
        >
          {maiorTaxa.length ? <Barras itens={maiorTaxa.map((i) => ({ rotulo: i.nome, sub: `${fmtInt(i.conversoes)} de ${fmtInt(i.sessoes)} sessões`, href: link(i), valor: taxa(i), texto: fmtPct(taxa(i)) }))} formato={(n) => fmtPct(n)} /> : <Vazio titulo="Nenhum imóvel com sessões suficientes" />}
        </Cartao>
        <Cartao
          titulo="Muita visita, pouco contato"
          descricao="Imóveis que atraem gente mas não geram conversa. Vale rever preço, fotos, descrição e se o imóvel ainda está disponível."
          tabela={<TabelaDados legenda="Imóveis com muita visita e pouco contato" colunas={[{ id: 'imovel', titulo: 'Imóvel' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={oportunidades.map((i) => ({ imovel: { v: i.nome, href: `/admin/imoveis/${i.id}` }, sessoes: i.sessoes, taxa: { v: taxa(i), t: fmtPct(taxa(i)) } }))} ordem={{ coluna: 'sessoes', decrescente: true }} limite={10} />}
        >
          {oportunidades.length ? (
            <Barras itens={oportunidades.slice(0, 10).map((i) => ({ rotulo: i.nome, sub: `Taxa de contato ${fmtPct(taxa(i))} (média ${fmtPct(taxaGeral)})`, href: `/admin/imoveis/${i.id}`, valor: i.sessoes }))} formato={fmtInt} cor="var(--g-4)" />
          ) : <Vazio titulo="Nenhum imóvel nessa situação" texto="Todos os imóveis com visitas suficientes geram contato em proporção parecida." />}
        </Cartao>
      </div>

      <Cartao
        titulo="Todos os imóveis"
        descricao="Clique no cabeçalho para ordenar e use a busca para achar um imóvel. O nome abre a edição no painel."
        tabela={undefined}
      >
        <TabelaDados
          legenda="Desempenho de todos os imóveis"
          buscar
          limite={15}
          colunas={[
            { id: 'imovel', titulo: 'Imóvel' },
            { id: 'cidade', titulo: 'Local' },
            { id: 'construtora', titulo: 'Construtora' },
            { id: 'preco', titulo: 'Preço', numerica: true },
            { id: 'visitas', titulo: 'Visitas', numerica: true },
            { id: 'visitantes', titulo: 'Visitantes', numerica: true },
            { id: 'tempo', titulo: 'Tempo', numerica: true },
            { id: 'rolagem', titulo: 'Rolagem', numerica: true },
            { id: 'fotos', titulo: 'Fotos', numerica: true },
            { id: 'contatos', titulo: 'Contatos', numerica: true },
            { id: 'taxa', titulo: 'Taxa', numerica: true },
            { id: 'sinal', titulo: 'Situação', semOrdenar: true },
          ]}
          linhas={todos}
          ordem={{ coluna: 'visitas', decrescente: true }}
        />
      </Cartao>

      <div className={s.grade}>
        {grupos.map((g) => (
          <Cartao
            key={g.titulo}
            titulo={g.titulo}
            descricao={`${g.descricao} Barras: visitas por imóvel (o interesse em relação a quantos imóveis há no grupo).`}
            tabela={
              <TabelaDados
                legenda={g.titulo}
                colunas={[{ id: 'grupo', titulo: 'Grupo' }, { id: 'imoveis', titulo: 'Imóveis', numerica: true }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'porImovel', titulo: 'Visitas por imóvel', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }, { id: 'taxa', titulo: 'Taxa de contato', numerica: true }]}
                linhas={g.itens.map((x) => ({ grupo: x.chave, imoveis: x.imoveis, visitas: x.visitas, porImovel: { v: razao(x.visitas, x.imoveis), t: razao(x.visitas, x.imoveis).toFixed(1).replace('.', ',') }, contatos: x.contatos, taxa: { v: razao(x.conversoes, x.sessoes), t: fmtPct(razao(x.conversoes, x.sessoes)) } }))}
                ordem={{ coluna: 'porImovel', decrescente: true }}
              />
            }
          >
            {g.itens.some((x) => x.visitas > 0) ? (
              <Barras
                itens={[...g.itens].filter((x) => x.imoveis > 0).sort((a, b) => razao(b.visitas, b.imoveis) - razao(a.visitas, a.imoveis)).map((x) => ({ rotulo: x.chave, sub: `${fmtInt(x.imoveis)} imóveis`, valor: razao(x.visitas, x.imoveis), texto: razao(x.visitas, x.imoveis).toFixed(1).replace('.', ','), extras: [['Visitas', fmtInt(x.visitas)], ['Taxa de contato', fmtPct(razao(x.conversoes, x.sessoes))]] }))}
                formato={(n) => n.toFixed(1).replace('.', ',')}
              />
            ) : nada}
          </Cartao>
        ))}
        <Cartao
          titulo="De onde vêm os cliques nos imóveis"
          descricao="Em que lista a pessoa estava quando abriu um imóvel."
          tabela={<TabelaDados legenda="Cliques em cards de imóveis" colunas={[{ id: 'lista', titulo: 'Lista' }, { id: 'cliques', titulo: 'Cliques', numerica: true }]} linhas={Object.entries(origemDosCliques).map(([l, n]) => ({ lista: rotuloLista[l] ?? l, cliques: n }))} ordem={{ coluna: 'cliques', decrescente: true }} />}
        >
          {Object.keys(origemDosCliques).length ? <Barras itens={Object.entries(origemDosCliques).sort((a, b) => b[1] - a[1]).map(([l, n]) => ({ rotulo: rotuloLista[l] ?? l, valor: n }))} formato={fmtInt} /> : <Vazio titulo="Nenhum clique em card neste período" />}
        </Cartao>
      </div>

      <Cartao
        titulo="Imóveis sem nenhuma visita"
        descricao="Ativos que ninguém abriu no período. Pode ser falta de divulgação, preço fora da faixa procurada ou cadastro pouco atraente."
        tabela={undefined}
      >
        {semVisita.length ? (
          <TabelaDados
            legenda="Imóveis sem visitas"
            limite={10}
            buscar
            colunas={[{ id: 'imovel', titulo: 'Imóvel' }, { id: 'local', titulo: 'Local' }, { id: 'construtora', titulo: 'Construtora' }, { id: 'preco', titulo: 'Preço', numerica: true }]}
            linhas={semVisita.map((i) => ({ imovel: { v: i.nome, href: `/admin/imoveis/${i.id}` }, local: local(i), construtora: i.construtora, preco: i.preco === null ? null : { v: i.preco, t: fmtMoeda(i.preco) } }))}
            ordem={{ coluna: 'imovel' }}
          />
        ) : <Vazio titulo={temDados ? 'Todos os imóveis ativos foram visitados' : 'Sem dados de visita neste período'} />}
      </Cartao>
    </>
  )
}
