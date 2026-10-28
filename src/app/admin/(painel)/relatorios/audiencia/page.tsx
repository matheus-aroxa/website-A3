import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Colunas, GraficoLinha, MapaDeCalor, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { pontosDeLinha, taxas } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao, serieDiaria, somar, visitasPorHoraESemana } from '@/lib/relatorios/audiencia'
import { fmtDuracao, fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { formatarDia } from '@/lib/relatorios/periodo'
import { DIAS_DA_SEMANA, rotuloTipoDePagina } from '@/lib/relatorios/rotulos'

export default function PaginaAudiencia({ searchParams }: PageProps<'/admin/relatorios/audiencia'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams}>
      {(ctx) => <Audiencia ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const nomeDoEstado = (chave: string) => chave.split('-')[1] ?? chave
const nomeDoPais = (chave: string) => {
  try {
    return new Intl.DisplayNames('pt-BR', { type: 'region' }).of(chave) ?? chave
  } catch {
    return chave
  }
}

async function Audiencia({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [atual, estados, cidades, paises, tipos, grade] = await Promise.all([
    serieDiaria(periodo),
    porDimensao(periodo, 'estado', { limite: 15 }),
    porDimensao(periodo, 'cidade'),
    porDimensao(periodo, 'pais', { limite: 10 }),
    porDimensao(periodo, 'tipo-pagina', { ordem: 'visitas' }),
    visitasPorHoraESemana(periodo),
  ])
  const t = somar(atual)
  const tx = taxas(t)
  const semDados = t.sessoes === 0

  const porDiaSemana = DIAS_DA_SEMANA.map((rotulo, d) => ({ rotulo, valor: grade[d]!.reduce((a, b) => a + b, 0) }))
  const porHora = Array.from({ length: 24 }, (_, h) => ({ rotulo: String(h), nome: `${String(h).padStart(2, '0')}h às ${String(h + 1).padStart(2, '0')}h`, valor: grade.reduce((a, linha) => a + linha[h]!, 0) }))
  const melhorHora = porHora.reduce((a, b) => (b.valor > a.valor ? b : a), porHora[0]!)
  const melhorDia = porDiaSemana.reduce((a, b) => (b.valor > a.valor ? b : a), porDiaSemana[0]!)

  const kpis = [
    { rotulo: 'Visitas', valor: fmtInt(t.visitas), nota: 'Páginas abertas no site. Quem abre 5 páginas soma 5 visitas.' },
    { rotulo: 'Visitantes', valor: fmtInt(t.visitantes), nota: 'Pessoas diferentes em cada dia, somadas. Quem volta em outro dia conta de novo.' },
    { rotulo: 'Sessões', valor: fmtInt(t.sessoes), nota: 'Cada vez que alguém entra no site. Depois de 30 min parado, a próxima entrada é outra sessão.' },
    { rotulo: 'Páginas por sessão', valor: tx.paginasPorSessao.toFixed(1).replace('.', ','), nota: 'Quantas páginas, em média, a pessoa vê em cada sessão.' },
    { rotulo: 'Tempo por sessão', valor: fmtDuracao(tx.duracao), nota: 'Tempo médio de cada sessão, contando só quando a página está aberta na tela.' },
    { rotulo: 'Rejeição', valor: fmtPct(tx.rejeicao), nota: 'Sessões em que a pessoa viu uma página só, não interagiu e saiu em menos de 10 s.' },
  ]

  const semSessoes = <Vazio titulo="Sem sessões neste período" />
  const tabelaDiaria = (
    <TabelaDados
      legenda="Audiência por dia"
      limite={15}
      ordem={{ coluna: 'dia', decrescente: true }}
      colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'visitantes', titulo: 'Visitantes', numerica: true }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'rejeicao', titulo: 'Rejeição', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]}
      linhas={atual.map((p) => ({ dia: { v: p.dia, t: formatarDia(p.dia) }, visitas: p.visitas, visitantes: p.visitantes, sessoes: p.sessoes, rejeicao: { v: razao(p.rejeicoes, p.sessoes), t: fmtPct(razao(p.rejeicoes, p.sessoes)) }, contatos: p.conversoes }))}
    />
  )

  return (
    <>
      <GradeKpi>
        {kpis.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} nota={k.nota} />
        ))}
      </GradeKpi>

      <div className={s.grade}>
        <Cartao titulo="Visitas por dia" descricao="Páginas vistas a cada dia." tabela={tabelaDiaria}>
          {periodo.dias < 2 ? <Vazio titulo="Escolha um período com mais de um dia" /> : <GraficoLinha pontos={pontosDeLinha(atual, (p) => p.visitas)} formato={fmtInt} nomeSerie="Visitas" />}
        </Cartao>
        <Cartao titulo="Visitantes por dia" descricao="Pessoas diferentes por dia (a mesma pessoa em dias diferentes conta duas vezes)." tabela={tabelaDiaria}>
          {periodo.dias < 2 ? <Vazio titulo="Escolha um período com mais de um dia" /> : <GraficoLinha pontos={pontosDeLinha(atual, (p) => p.visitantes)} formato={fmtInt} nomeSerie="Visitantes" />}
        </Cartao>
      </div>

      <Cartao
        titulo="Quando as pessoas visitam"
        descricao={semDados ? undefined : `O pico é ${melhorDia.rotulo === 'Sáb' || melhorDia.rotulo === 'Dom' ? 'no ' : 'na '}${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][DIAS_DA_SEMANA.indexOf(melhorDia.rotulo)]?.toLowerCase()}, por volta das ${melhorHora.nome.slice(0, 3)}. Útil para escolher o horário de publicar e de ter alguém no WhatsApp.`}
        tabela={
          <TabelaDados
            legenda="Visitas por dia da semana e hora"
            limite={30}
            ordem={{ coluna: 'visitas', decrescente: true }}
            colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'hora', titulo: 'Hora' }, { id: 'visitas', titulo: 'Visitas', numerica: true }]}
            linhas={grade.flatMap((linha, d) => linha.map((v, h) => ({ dia: DIAS_DA_SEMANA[d]!, hora: { v: h, t: `${String(h).padStart(2, '0')}h` }, visitas: v })))}
          />
        }
      >
        {semDados ? semSessoes : <MapaDeCalor grade={grade} diasDaSemana={DIAS_DA_SEMANA} formato={fmtInt} />}
      </Cartao>

      <div className={s.grade}>
        <Cartao titulo="Por dia da semana" descricao="Visitas somadas no período." tabela={<TabelaDados legenda="Visitas por dia da semana" colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'visitas', titulo: 'Visitas', numerica: true }]} linhas={porDiaSemana.map((d) => ({ dia: d.rotulo, visitas: d.valor }))} />}>
          {semDados ? semSessoes : <Colunas itens={porDiaSemana} formato={fmtInt} />}
        </Cartao>
        <Cartao titulo="Por hora do dia" descricao="Visitas somadas no período, no horário de Recife." tabela={<TabelaDados legenda="Visitas por hora" limite={24} colunas={[{ id: 'hora', titulo: 'Hora' }, { id: 'visitas', titulo: 'Visitas', numerica: true }]} linhas={porHora.map((h) => ({ hora: { v: Number(h.rotulo), t: h.nome }, visitas: h.valor }))} ordem={{ coluna: 'hora' }} />}>
          {semDados ? semSessoes : <Colunas itens={porHora} formato={fmtInt} valores={false} />}
        </Cartao>
      </div>

      <Cartao
        titulo="Tipos de página"
        descricao="Quanto tempo as pessoas ficam e até onde rolam, em média."
        tabela={
          <TabelaDados
            legenda="Engajamento por tipo de página"
            colunas={[{ id: 'tipo', titulo: 'Tipo de página' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'tempo', titulo: 'Tempo médio', numerica: true }, { id: 'rolagem', titulo: 'Rolagem média', numerica: true }]}
            linhas={tipos.map((p) => ({ tipo: rotuloTipoDePagina[p.chave] ?? p.chave, visitas: p.visitas, tempo: { v: razao(p.tempo_s, p.eventos), t: fmtDuracao(razao(p.tempo_s, p.eventos)) }, rolagem: { v: razao(p.valor, p.eventos), t: `${Math.round(razao(p.valor, p.eventos))}%` } }))}
            ordem={{ coluna: 'visitas', decrescente: true }}
          />
        }
      >
        {tipos.length ? (
          <Barras itens={tipos.map((p) => ({ rotulo: rotuloTipoDePagina[p.chave] ?? p.chave, valor: p.visitas, sub: `${fmtDuracao(razao(p.tempo_s, p.eventos))} por página · rolagem ${Math.round(razao(p.valor, p.eventos))}%` }))} formato={fmtInt} />
        ) : semSessoes}
      </Cartao>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Estados" tabela={<TabelaDados legenda="Sessões por estado" colunas={[{ id: 'n', titulo: 'Estado' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={estados.map((n) => ({ n: nomeDoEstado(n.chave), sessoes: n.sessoes, contatos: n.conversoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {estados.length ? <Barras itens={estados.map((n) => ({ rotulo: nomeDoEstado(n.chave), valor: n.sessoes, extras: [['Contatos', fmtInt(n.conversoes)]] }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
        <Cartao titulo="Cidades" tabela={<TabelaDados legenda="Sessões por cidade" colunas={[{ id: 'n', titulo: 'Cidade' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={cidades.map((n) => ({ n: n.chave, sessoes: n.sessoes, contatos: n.conversoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {cidades.length ? <Barras itens={cidades.map((n) => ({ rotulo: n.chave.replace(/\/$/, '').replace('/', ' – '), valor: n.sessoes, extras: [['Contatos', fmtInt(n.conversoes)]] }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
        <Cartao titulo="Países" tabela={<TabelaDados legenda="Sessões por país" colunas={[{ id: 'n', titulo: 'País' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={paises.map((n) => ({ n: nomeDoPais(n.chave), sessoes: n.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {paises.length ? <Barras itens={paises.map((n) => ({ rotulo: nomeDoPais(n.chave), valor: n.sessoes }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
      </div>
    </>
  )
}
