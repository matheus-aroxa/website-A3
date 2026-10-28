import { Cartao } from '@/components/admin/relatorios/Cartao'
import { BarraEmpilhada, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { METRICAS_VITAIS, porDimensao, vitais, type MetricaVital } from '@/lib/relatorios/audiencia'
import { fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { criarNomeadorDePaginas } from '@/lib/relatorios/paginas'
import { rotuloAparelho } from '@/lib/relatorios/rotulos'

export default function PaginaDesempenho({ searchParams }: PageProps<'/admin/relatorios/desempenho'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} arquivo="desempenho">
      {(ctx) => <Desempenho ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const METRICAS: Record<MetricaVital, { nome: string; descricao: string; bom: string; ruim: string; formato: (n: number) => string }> = {
  lcp: { nome: 'Carregamento (LCP)', descricao: 'Tempo até o maior elemento da tela (geralmente a foto) aparecer.', bom: 'até 2,5 s', ruim: 'acima de 4 s', formato: (n) => `${(n / 1000).toFixed(1).replace('.', ',')} s` },
  inp: { nome: 'Resposta ao toque (INP)', descricao: 'Tempo que a página leva para reagir a um toque ou clique.', bom: 'até 200 ms', ruim: 'acima de 500 ms', formato: (n) => `${Math.round(n)} ms` },
  cls: { nome: 'Estabilidade (CLS)', descricao: 'Quanto o conteúdo “pula” enquanto carrega.', bom: 'até 0,1', ruim: 'acima de 0,25', formato: (n) => n.toFixed(2).replace('.', ',') },
  fcp: { nome: 'Primeira exibição (FCP)', descricao: 'Tempo até aparecer qualquer conteúdo.', bom: 'até 1,8 s', ruim: 'acima de 3 s', formato: (n) => `${(n / 1000).toFixed(1).replace('.', ',')} s` },
  ttfb: { nome: 'Resposta do servidor (TTFB)', descricao: 'Tempo até o servidor começar a responder.', bom: 'até 0,8 s', ruim: 'acima de 1,8 s', formato: (n) => `${(n / 1000).toFixed(1).replace('.', ',')} s` },
}

// Cores de estado do guia (bom, atenção, crítico); o texto da legenda sempre diz o estado.
const NOTA = { bom: '#0ca30c', medio: '#fab219', ruim: '#d03b3b' }

async function Desempenho({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [medidas, nomear, lentas, erros] = await Promise.all([
    vitais(periodo),
    criarNomeadorDePaginas(),
    porDimensao(periodo, 'vital-pagina', { ordem: 'eventos', limite: 300 }),
    porDimensao(periodo, 'erro', { ordem: 'eventos', limite: 50 }),
  ])
  const amostras = medidas['lcp:todos']?.amostras ?? 0
  const lentasMedia = lentas.filter((l) => l.eventos >= 3).map((l) => ({ ...l, media: razao(l.valor, l.eventos) })).sort((a, b) => b.media - a.media).slice(0, 15)
  const totalErros = erros.reduce((a, e) => a + e.eventos, 0)
  const aparelhos = ['celular', 'computador', 'tablet']
  const bomDe = (m: MetricaVital) => {
    const x = medidas[`${m}:todos`]
    return x ? razao(x.bom, x.amostras) : 0
  }

  return (
    <>
      <p className={s.aviso}>
        <span>
          <strong>Como ler.</strong> São as medições reais das pessoas que visitaram o site, no padrão que o Google usa para avaliar a experiência (Core Web Vitals). Para cada métrica, a barra mostra quantas visitas foram boas, medianas e ruins. Quanto mais verde, melhor. Só entram carregamentos completos do site (não a navegação entre páginas).
        </span>
      </p>
      <GradeKpi
        titulo="Indicadores de desempenho"
        itens={[
          { rotulo: 'Visitas medidas', valor: fmtInt(amostras) },
          ...METRICAS_VITAIS.map((m) => ({ rotulo: `${METRICAS[m].nome}: visitas boas`, valor: fmtPct(bomDe(m), 0) })),
          { rotulo: 'Erros de JavaScript', valor: fmtInt(totalErros) },
        ]}
      >
        <Kpi rotulo="Visitas medidas" valor={fmtInt(amostras)} nota="Com velocidade registrada" />
        {(['lcp', 'inp', 'cls'] as const).map((m) => (
          <Kpi key={m} rotulo={METRICAS[m].nome} valor={amostras ? fmtPct(bomDe(m), 0) : '—'} nota="das visitas com nota boa" />
        ))}
        <Kpi rotulo="Erros de JavaScript" valor={fmtInt(totalErros)} nota={`${fmtInt(erros.length)} ${erros.length === 1 ? 'tipo' : 'tipos'} de erro`} />
      </GradeKpi>

      <div className={s.grade} data-colunas="3">
        {METRICAS_VITAIS.map((m) => {
          const info = METRICAS[m]
          const todos = medidas[`${m}:todos`]
          return (
            <Cartao
              key={m}
              titulo={info.nome}
              descricao={info.descricao}
              rodape={`Bom: ${info.bom}. Ruim: ${info.ruim}.`}
              tabela={
                <TabelaDados
                  legenda={info.nome}
                  colunas={[{ id: 'a', titulo: 'Aparelho' }, { id: 'n', titulo: 'Medições', numerica: true }, { id: 'media', titulo: 'Média', numerica: true }, { id: 'bom', titulo: 'Bom', numerica: true }, { id: 'medio', titulo: 'Mediano', numerica: true }, { id: 'ruim', titulo: 'Ruim', numerica: true }]}
                  linhas={['todos', ...aparelhos].flatMap((a) => {
                    const x = medidas[`${m}:${a}`]
                    return x ? [{ a: a === 'todos' ? 'Todos' : rotuloAparelho[a]!, n: x.amostras, media: { v: x.media, t: info.formato(x.media) }, bom: { v: razao(x.bom, x.amostras), t: fmtPct(razao(x.bom, x.amostras), 0) }, medio: { v: razao(x.medio, x.amostras), t: fmtPct(razao(x.medio, x.amostras), 0) }, ruim: { v: razao(x.ruim, x.amostras), t: fmtPct(razao(x.ruim, x.amostras), 0) } }] : []
                  })}
                  limite={5}
                />
              }
            >
              {todos ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <BarraEmpilhada
                    formato={fmtInt}
                    segmentos={[
                      { rotulo: 'Bom', valor: todos.bom, cor: NOTA.bom },
                      { rotulo: 'Mediano', valor: todos.medio, cor: NOTA.medio, escuro: true },
                      { rotulo: 'Ruim', valor: todos.ruim, cor: NOTA.ruim },
                    ]}
                  />
                  <p style={{ fontSize: 14 }}>
                    Média: <strong>{info.formato(todos.media)}</strong>
                    {aparelhos.map((a) => {
                      const x = medidas[`${m}:${a}`]
                      return x ? <span key={a} style={{ color: 'var(--texto-2)' }}> · {rotuloAparelho[a]}: {info.formato(x.media)}</span> : null
                    })}
                  </p>
                </div>
              ) : <Vazio titulo="Sem medições neste período" />}
            </Cartao>
          )
        })}
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Páginas mais lentas"
          descricao="Média do tempo de carregamento (LCP), a partir de 3 medições."
          tabela={undefined}
        >
          {lentasMedia.length ? (
            <TabelaDados
              legenda="Páginas mais lentas"
              limite={10}
              colunas={[{ id: 'pagina', titulo: 'Página' }, { id: 'lcp', titulo: 'LCP médio', numerica: true }, { id: 'n', titulo: 'Medições', numerica: true }]}
              linhas={lentasMedia.map((l) => ({ pagina: { v: nomear(l.chave).nome, href: l.chave }, lcp: { v: l.media, t: METRICAS.lcp.formato(l.media), tom: l.media > 4000 ? 'ruim' : l.media > 2500 ? 'atencao' : undefined }, n: l.eventos }))}
              ordem={{ coluna: 'lcp', decrescente: true }}
            />
          ) : <Vazio titulo="Medições insuficientes" texto="Ainda não há 3 medições de nenhuma página." />}
        </Cartao>
        <Cartao
          titulo="Erros de JavaScript"
          descricao="Erros que aconteceram no navegador das pessoas (no máximo 3 por página aberta)."
          tabela={undefined}
        >
          {erros.length ? (
            <TabelaDados legenda="Erros de JavaScript" limite={10} colunas={[{ id: 'erro', titulo: 'Mensagem' }, { id: 'vezes', titulo: 'Vezes', numerica: true }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={erros.map((e) => ({ erro: e.chave, vezes: e.eventos, sessoes: e.sessoes }))} ordem={{ coluna: 'vezes', decrescente: true }} />
          ) : <Vazio titulo="Nenhum erro registrado" texto="Bom sinal." />}
        </Cartao>
      </div>
    </>
  )
}
