import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, BarraEmpilhada, Colunas, GraficoLinha, Legenda, MapaDeCalor, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { COLUNAS_DE_AUDIENCIA, comparar, linhaDeAudiencia, pontosDeLinha, taxas } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao, serieDiaria, somar, visitasPorHoraESemana } from '@/lib/relatorios/audiencia'
import { fmtDuracao, fmtInt, fmtPct, razao, variacao } from '@/lib/relatorios/formato'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { formatarDia } from '@/lib/relatorios/periodo'
import { DIAS_DA_SEMANA, rotuloAparelho, rotuloTipoDePagina } from '@/lib/relatorios/rotulos'

export default function PaginaAudiencia({ searchParams }: PageProps<'/admin/relatorios/audiencia'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} comparavel arquivo="audiencia">
      {(ctx) => <Audiencia ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const CORES_APARELHO: Record<string, string> = { celular: 'var(--g-1)', computador: 'var(--g-2)', tablet: 'var(--g-3)', desconhecido: 'var(--g-anterior)' }
const nomeDoEstado = (chave: string) => chave.split('-')[1] ?? chave
const nomeDoPais = (chave: string) => {
  try {
    return new Intl.DisplayNames('pt-BR', { type: 'region' }).of(chave) ?? chave
  } catch {
    return chave
  }
}

async function Audiencia({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo, anterior, comparar: comp } = ctx
  const [atual, antes, aparelhos, navegadores, sistemas, estados, cidades, paises, idiomas, tipos, grade] = await Promise.all([
    serieDiaria(periodo),
    comp ? serieDiaria(anterior) : Promise.resolve(null),
    porDimensao(periodo, 'dispositivo'),
    porDimensao(periodo, 'navegador'),
    porDimensao(periodo, 'so'),
    porDimensao(periodo, 'estado', { limite: 15 }),
    porDimensao(periodo, 'cidade', { limite: 15 }),
    porDimensao(periodo, 'pais', { limite: 10 }),
    porDimensao(periodo, 'idioma', { limite: 8 }),
    porDimensao(periodo, 'tipo-pagina', { ordem: 'visitas' }),
    visitasPorHoraESemana(periodo),
  ])
  const t = somar(atual)
  const ta = antes ? somar(antes) : null
  const tx = taxas(t)
  const txa = ta ? taxas(ta) : null
  const semDados = t.sessoes === 0
  const legendaComparacao = antes ? <Legenda itens={[{ rotulo: 'Período escolhido', cor: 'var(--g-acento)', forma: 'linha' }, { rotulo: 'Período anterior', cor: 'var(--g-anterior)', forma: 'linha' }]} /> : null

  const porDiaSemana = DIAS_DA_SEMANA.map((rotulo, d) => ({ rotulo, valor: grade[d]!.reduce((a, b) => a + b, 0) }))
  const porHora = Array.from({ length: 24 }, (_, h) => ({ rotulo: String(h), nome: `${String(h).padStart(2, '0')}h às ${String(h + 1).padStart(2, '0')}h`, valor: grade.reduce((a, linha) => a + linha[h]!, 0) }))
  const melhorHora = porHora.reduce((a, b) => (b.valor > a.valor ? b : a), porHora[0]!)
  const melhorDia = porDiaSemana.reduce((a, b) => (b.valor > a.valor ? b : a), porDiaSemana[0]!)

  const kpis = [
    { rotulo: 'Visitas', valor: fmtInt(t.visitas), v: comparar(t.visitas, ta?.visitas), serie: atual.map((p) => p.visitas), nota: 'Páginas vistas' },
    { rotulo: 'Visitantes', valor: fmtInt(t.visitantes), v: comparar(t.visitantes, ta?.visitantes), serie: atual.map((p) => p.visitantes), nota: 'Soma dos visitantes de cada dia' },
    { rotulo: 'Sessões', valor: fmtInt(t.sessoes), v: comparar(t.sessoes, ta?.sessoes), serie: atual.map((p) => p.sessoes), nota: 'Termina após 30 min sem atividade' },
    { rotulo: 'Páginas por sessão', valor: tx.paginasPorSessao.toFixed(1).replace('.', ','), v: txa ? variacao(tx.paginasPorSessao, txa.paginasPorSessao) : undefined },
    { rotulo: 'Tempo por sessão', valor: fmtDuracao(tx.duracao), v: txa ? variacao(tx.duracao, txa.duracao) : undefined, nota: 'Tempo ativo nas páginas' },
    { rotulo: 'Rejeição', valor: fmtPct(tx.rejeicao), v: txa ? variacao(tx.rejeicao, txa.rejeicao) : undefined, sobe: false, nota: 'Uma página, sem interação e menos de 10 s' },
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
      <GradeKpi titulo="Indicadores de audiência" itens={kpis.map((k) => ({ rotulo: k.rotulo, valor: k.valor }))}>
        {kpis.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} variacao={k.v} subeEBom={k.sobe !== false} nota={k.nota} serie={k.serie} />
        ))}
      </GradeKpi>

      <div className={s.grade}>
        <Cartao titulo="Visitas por dia" descricao="Páginas vistas a cada dia." tabela={tabelaDiaria}>
          {periodo.dias < 2 ? <Vazio titulo="Escolha um período com mais de um dia" /> : (
            <>
              <GraficoLinha pontos={pontosDeLinha(atual, antes, (p) => p.visitas)} formato={fmtInt} nomeSerie="Visitas" />
              {legendaComparacao}
            </>
          )}
        </Cartao>
        <Cartao titulo="Visitantes por dia" descricao="Pessoas diferentes por dia (sem cookies, a mesma pessoa em dias diferentes conta duas vezes)." tabela={tabelaDiaria}>
          {periodo.dias < 2 ? <Vazio titulo="Escolha um período com mais de um dia" /> : (
            <>
              <GraficoLinha pontos={pontosDeLinha(atual, antes, (p) => p.visitantes)} formato={fmtInt} nomeSerie="Visitantes" />
              {legendaComparacao}
            </>
          )}
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

      <div className={s.grade}>
        <Cartao
          titulo="Aparelhos"
          descricao="Como as pessoas acessam o site."
          tabela={<TabelaDados legenda="Sessões por aparelho" colunas={COLUNAS_DE_AUDIENCIA.map((c) => (c.id === 'chave' ? { ...c, titulo: 'Aparelho' } : c))} linhas={aparelhos.map((a) => linhaDeAudiencia(rotuloAparelho[a.chave] ?? a.chave, a))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {aparelhos.length ? <BarraEmpilhada segmentos={aparelhos.map((a) => ({ rotulo: rotuloAparelho[a.chave] ?? a.chave, valor: a.sessoes, cor: CORES_APARELHO[a.chave] ?? 'var(--g-anterior)' }))} formato={fmtInt} /> : semSessoes}
        </Cartao>
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
      </div>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Navegadores" descricao="Sessões por navegador." tabela={<TabelaDados legenda="Sessões por navegador" colunas={[{ id: 'n', titulo: 'Navegador' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={navegadores.map((n) => ({ n: n.chave, sessoes: n.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {navegadores.length ? <Barras itens={navegadores.slice(0, 8).map((n) => ({ rotulo: n.chave, valor: n.sessoes }))} formato={fmtInt} /> : semSessoes}
        </Cartao>
        <Cartao titulo="Sistemas" descricao="Sessões por sistema operacional." tabela={<TabelaDados legenda="Sessões por sistema" colunas={[{ id: 'n', titulo: 'Sistema' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={sistemas.map((n) => ({ n: n.chave, sessoes: n.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {sistemas.length ? <Barras itens={sistemas.slice(0, 8).map((n) => ({ rotulo: n.chave, valor: n.sessoes }))} formato={fmtInt} /> : semSessoes}
        </Cartao>
        <Cartao titulo="Idiomas" descricao="Idioma configurado no navegador." tabela={<TabelaDados legenda="Sessões por idioma" colunas={[{ id: 'n', titulo: 'Idioma' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={idiomas.map((n) => ({ n: n.chave, sessoes: n.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {idiomas.length ? <Barras itens={idiomas.map((n) => ({ rotulo: n.chave.toUpperCase(), valor: n.sessoes }))} formato={fmtInt} /> : semSessoes}
        </Cartao>
      </div>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Estados" descricao="De onde vêm as sessões (localização aproximada pelo IP, sem guardar o IP)." tabela={<TabelaDados legenda="Sessões por estado" colunas={[{ id: 'n', titulo: 'Estado' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={estados.map((n) => ({ n: nomeDoEstado(n.chave), sessoes: n.sessoes, contatos: n.conversoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {estados.length ? <Barras itens={estados.map((n) => ({ rotulo: nomeDoEstado(n.chave), valor: n.sessoes, extras: [['Contatos', fmtInt(n.conversoes)]] }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
        <Cartao titulo="Cidades" descricao="As 15 cidades com mais sessões." tabela={<TabelaDados legenda="Sessões por cidade" colunas={[{ id: 'n', titulo: 'Cidade' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={cidades.map((n) => ({ n: n.chave, sessoes: n.sessoes, contatos: n.conversoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {cidades.length ? <Barras itens={cidades.map((n) => ({ rotulo: n.chave.replace(/\/$/, '').replace('/', ' – '), valor: n.sessoes, extras: [['Contatos', fmtInt(n.conversoes)]] }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
        <Cartao titulo="Países" tabela={<TabelaDados legenda="Sessões por país" colunas={[{ id: 'n', titulo: 'País' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={paises.map((n) => ({ n: nomeDoPais(n.chave), sessoes: n.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}>
          {paises.length ? <Barras itens={paises.map((n) => ({ rotulo: nomeDoPais(n.chave), valor: n.sessoes }))} formato={fmtInt} /> : <Vazio titulo="Sem localização neste período" />}
        </Cartao>
      </div>
    </>
  )
}
