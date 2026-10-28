import Link from 'next/link'
import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao } from '@/lib/relatorios/audiencia'
import { fmtDuracao, fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { criarNomeadorDePaginas } from '@/lib/relatorios/paginas'
import { rotuloTipoDePagina } from '@/lib/relatorios/rotulos'

export default function PaginaPaginas({ searchParams }: PageProps<'/admin/relatorios/paginas'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} arquivo="paginas">
      {(ctx) => <Paginas ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

async function Paginas({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [nomear, paginas, entradas, saidas, naoEncontradas, tipos] = await Promise.all([
    criarNomeadorDePaginas(),
    porDimensao(periodo, 'pagina', { ordem: 'visitas', limite: 300 }),
    porDimensao(periodo, 'entrada', { limite: 200 }),
    porDimensao(periodo, 'saida', { limite: 200 }),
    porDimensao(periodo, 'nao-encontrada', { ordem: 'eventos', limite: 100 }),
    porDimensao(periodo, 'tipo-pagina', { ordem: 'visitas' }),
  ])
  const total = paginas.reduce((a, p) => a + p.visitas, 0)
  const n404 = naoEncontradas.reduce((a, p) => a + p.eventos, 0)
  const nada = <Vazio titulo="Sem visitas neste período" />
  const link = (caminho: string) => {
    const { nome, href } = nomear(caminho)
    return { v: nome, href }
  }

  return (
    <>
      <GradeKpi titulo="Indicadores de páginas" itens={[{ rotulo: 'Páginas vistas', valor: fmtInt(total) }, { rotulo: 'Páginas diferentes visitadas', valor: fmtInt(paginas.length) }, { rotulo: 'Acessos a páginas inexistentes', valor: fmtInt(n404) }]}>
        <Kpi rotulo="Páginas vistas" valor={fmtInt(total)} />
        <Kpi rotulo="Páginas diferentes" valor={fmtInt(paginas.length)} nota="Imóveis, buscas e institucionais" />
        <Kpi rotulo="Páginas inexistentes" valor={fmtInt(n404)} nota={n404 ? `${fmtInt(naoEncontradas.length)} endereços diferentes` : 'Nenhum acesso a link quebrado'} />
      </GradeKpi>

      <Cartao
        titulo="Páginas mais vistas"
        descricao="Todas as páginas do site, da mais para a menos visitada."
        tabela={
          <TabelaDados
            legenda="Páginas mais vistas"
            limite={15}
            buscar
            colunas={[{ id: 'pagina', titulo: 'Página' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'visitantes', titulo: 'Visitantes', numerica: true }, { id: 'tempo', titulo: 'Tempo médio', numerica: true }, { id: 'rolagem', titulo: 'Rolagem média', numerica: true }]}
            linhas={paginas.map((p) => ({ pagina: link(p.chave), visitas: p.visitas, visitantes: p.visitantes, tempo: { v: razao(p.tempo_s, p.eventos), t: fmtDuracao(razao(p.tempo_s, p.eventos)) }, rolagem: { v: razao(p.valor, p.eventos), t: `${Math.round(razao(p.valor, p.eventos))}%` } }))}
            ordem={{ coluna: 'visitas', decrescente: true }}
          />
        }
      >
        {paginas.length ? (
          <Barras itens={paginas.slice(0, 12).map((p) => ({ rotulo: nomear(p.chave).nome, href: p.chave, valor: p.visitas, extras: [['Tempo médio', fmtDuracao(razao(p.tempo_s, p.eventos))], ['Rolagem média', `${Math.round(razao(p.valor, p.eventos))}%`]] }))} formato={fmtInt} />
        ) : nada}
      </Cartao>

      <div className={s.grade}>
        <Cartao
          titulo="Páginas de entrada"
          descricao="Onde as sessões começam. A rejeição mostra quem saiu sem interagir."
          tabela={
            <TabelaDados
              legenda="Páginas de entrada"
              limite={12}
              colunas={[{ id: 'pagina', titulo: 'Página' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'rejeicao', titulo: 'Rejeição', numerica: true }, { id: 'contato', titulo: 'Contato', numerica: true }]}
              linhas={entradas.map((p) => ({ pagina: link(p.chave), sessoes: p.sessoes, rejeicao: { v: razao(p.rejeicoes, p.sessoes), t: fmtPct(razao(p.rejeicoes, p.sessoes)) }, contato: { v: razao(p.conversoes, p.sessoes), t: fmtPct(razao(p.conversoes, p.sessoes)) } }))}
              ordem={{ coluna: 'sessoes', decrescente: true }}
            />
          }
        >
          {entradas.length ? <Barras itens={entradas.slice(0, 10).map((p) => ({ rotulo: nomear(p.chave).nome, valor: p.sessoes, extras: [['Rejeição', fmtPct(razao(p.rejeicoes, p.sessoes))], ['Contato', fmtPct(razao(p.conversoes, p.sessoes))]] }))} formato={fmtInt} /> : nada}
        </Cartao>
        <Cartao
          titulo="Páginas de saída"
          descricao="Onde as sessões terminam."
          tabela={<TabelaDados legenda="Páginas de saída" limite={12} colunas={[{ id: 'pagina', titulo: 'Página' }, { id: 'sessoes', titulo: 'Saídas', numerica: true }]} linhas={saidas.map((p) => ({ pagina: link(p.chave), sessoes: p.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {saidas.length ? <Barras itens={saidas.slice(0, 10).map((p) => ({ rotulo: nomear(p.chave).nome, valor: p.sessoes }))} formato={fmtInt} /> : nada}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Tipos de página"
          descricao="Visitas, tempo e rolagem por grupo de páginas."
          tabela={<TabelaDados legenda="Tipos de página" colunas={[{ id: 'tipo', titulo: 'Tipo' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'tempo', titulo: 'Tempo médio', numerica: true }, { id: 'rolagem', titulo: 'Rolagem média', numerica: true }]} linhas={tipos.map((p) => ({ tipo: rotuloTipoDePagina[p.chave] ?? p.chave, visitas: p.visitas, tempo: { v: razao(p.tempo_s, p.eventos), t: fmtDuracao(razao(p.tempo_s, p.eventos)) }, rolagem: { v: razao(p.valor, p.eventos), t: `${Math.round(razao(p.valor, p.eventos))}%` } }))} ordem={{ coluna: 'visitas', decrescente: true }} />}
        >
          {tipos.length ? <Barras itens={tipos.map((p) => ({ rotulo: rotuloTipoDePagina[p.chave] ?? p.chave, valor: p.visitas, sub: `${fmtDuracao(razao(p.tempo_s, p.eventos))} · rolagem ${Math.round(razao(p.valor, p.eventos))}%` }))} formato={fmtInt} /> : nada}
        </Cartao>
        <Cartao
          titulo="Páginas que não existem (404)"
          descricao="Links quebrados, imóveis que saíram do ar e endereços digitados errado."
          rodape={naoEncontradas.length ? <>Dica: se um endereço antigo de imóvel aparece muito aqui, vale <Link href="/admin">reativar o imóvel</Link> ou avisar quem divulgou o link.</> : undefined}
          tabela={<TabelaDados legenda="Páginas inexistentes acessadas" colunas={[{ id: 'caminho', titulo: 'Endereço' }, { id: 'acessos', titulo: 'Acessos', numerica: true }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={naoEncontradas.map((p) => ({ caminho: p.chave, acessos: p.eventos, sessoes: p.sessoes }))} ordem={{ coluna: 'acessos', decrescente: true }} />}
        >
          {naoEncontradas.length ? <Barras itens={naoEncontradas.slice(0, 10).map((p) => ({ rotulo: p.chave, valor: p.eventos }))} formato={fmtInt} cor="var(--g-2)" /> : <Vazio titulo="Nenhum acesso a página inexistente" texto="Bom sinal: os links do site estão funcionando." />}
        </Cartao>
      </div>
    </>
  )
}
