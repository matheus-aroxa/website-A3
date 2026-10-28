import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Colunas, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { atividadeDoPainel } from '@/lib/relatorios/catalogo'
import { fmtInt } from '@/lib/relatorios/formato'
import { diaDaSemana, formatarDia, listarDias } from '@/lib/relatorios/periodo'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { DIAS_DA_SEMANA } from '@/lib/relatorios/rotulos'

export default function PaginaPainel({ searchParams }: PageProps<'/admin/relatorios/painel'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} medicao={false} arquivo="atividade-do-painel">
      {(ctx) => <Painel ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const ROTULO_ACAO: Record<string, string> = {
  criar: 'Imóveis criados',
  editar: 'Imóveis editados',
  ativar: 'Imóveis ativados',
  desativar: 'Imóveis desativados',
  excluir: 'Imóveis excluídos',
  vitrine: 'Vitrine da home alterada',
  'construtora-criar': 'Construtoras criadas',
  'construtora-renomear': 'Construtoras renomeadas',
  'construtora-excluir': 'Construtoras excluídas',
}

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

async function Painel({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const a = await atividadeDoPainel(periodo.de, periodo.ate)
  const total = a.porAcao.reduce((n, x) => n + x.valor, 0)
  const porDia = new Map(a.porDia.map((d) => [d.dia, d.valor]))
  const dias = listarDias(periodo).map((dia) => ({ dia, valor: porDia.get(dia) ?? 0 }))
  const ativos = a.administradores.filter((x) => x.ativo)
  const mostrarPorDia = dias.length <= 62

  return (
    <>
      <p className={s.aviso}>
        <span>
          <strong>O que entra aqui.</strong> Cada alteração feita no painel (criar, editar, ativar, desativar e excluir imóveis, vitrine e construtoras) fica registrada com quem fez e quando. Tentativas de login com senha errada não ficam guardadas por mais de um dia, então não aparecem.
        </span>
      </p>
      <GradeKpi
        titulo="Indicadores da atividade do painel"
        itens={[
          { rotulo: 'Alterações no período', valor: fmtInt(total) },
          { rotulo: 'Administradores ativos', valor: fmtInt(ativos.length) },
          { rotulo: 'Sessões abertas agora', valor: fmtInt(a.sessoesAbertas) },
        ]}
      >
        <Kpi rotulo="Alterações no período" valor={fmtInt(total)} />
        <Kpi rotulo="Administradores ativos" valor={fmtInt(ativos.length)} />
        <Kpi rotulo="Sessões abertas agora" valor={fmtInt(a.sessoesAbertas)} nota="Logins válidos neste momento" />
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Alterações por tipo"
          tabela={<TabelaDados legenda="Alterações por tipo" colunas={[{ id: 'a', titulo: 'Alteração' }, { id: 'n', titulo: 'Quantidade', numerica: true }]} linhas={a.porAcao.map((x) => ({ a: ROTULO_ACAO[x.chave] ?? x.chave, n: x.valor }))} ordem={{ coluna: 'n', decrescente: true }} />}
        >
          {a.porAcao.length ? <Barras itens={a.porAcao.map((x) => ({ rotulo: ROTULO_ACAO[x.chave] ?? x.chave, valor: x.valor }))} formato={fmtInt} /> : <Vazio titulo="Nenhuma alteração neste período" />}
        </Cartao>
        <Cartao
          titulo="Alterações por pessoa"
          tabela={<TabelaDados legenda="Alterações por pessoa" colunas={[{ id: 'a', titulo: 'Quem' }, { id: 'n', titulo: 'Alterações', numerica: true }]} linhas={a.porAutor.map((x) => ({ a: x.chave, n: x.valor }))} ordem={{ coluna: 'n', decrescente: true }} />}
        >
          {a.porAutor.length ? <Barras itens={a.porAutor.map((x) => ({ rotulo: x.chave, valor: x.valor }))} formato={fmtInt} /> : <Vazio titulo="Nenhuma alteração neste período" />}
        </Cartao>
      </div>

      <Cartao
        titulo="Alterações por dia"
        tabela={<TabelaDados legenda="Alterações por dia" limite={15} colunas={[{ id: 'd', titulo: 'Dia' }, { id: 'n', titulo: 'Alterações', numerica: true }]} linhas={dias.map((d) => ({ d: { v: d.dia, t: formatarDia(d.dia) }, n: d.valor }))} ordem={{ coluna: 'd', decrescente: true }} />}
      >
        {total === 0 ? <Vazio titulo="Nenhuma alteração neste período" /> : mostrarPorDia ? (
          <Colunas itens={dias.map((d) => ({ rotulo: dias.length > 20 ? (diaDaSemana(d.dia) === 1 ? formatarDia(d.dia, true) : '') : formatarDia(d.dia, true), nome: `${DIAS_DA_SEMANA[diaDaSemana(d.dia)]}, ${formatarDia(d.dia)}`, valor: d.valor }))} formato={fmtInt} valores={false} />
        ) : <Vazio titulo="Período longo demais para o gráfico diário" texto="Escolha até 60 dias; a tabela mostra todos os dias." />}
      </Cartao>

      <div className={s.grade}>
        <Cartao titulo="Administradores" descricao="Quem tem acesso ao painel e quando entrou pela última vez." tabela={undefined}>
          <TabelaDados
            legenda="Administradores"
            limite={10}
            colunas={[{ id: 'e', titulo: 'Usuário' }, { id: 'u', titulo: 'Último acesso' }, { id: 's', titulo: 'Situação' }]}
            linhas={a.administradores.map((x) => ({ e: x.nome ? `${x.nome} (${x.email})` : x.email, u: x.ultimoAcesso ? { v: x.ultimoAcesso, t: dataHora(x.ultimoAcesso) } : 'Nunca entrou', s: x.ativo ? 'Ativo' : { v: 'Desativado', tom: 'atencao' } }))}
            ordem={{ coluna: 'u', decrescente: true }}
          />
        </Cartao>
        <Cartao titulo="Últimas alterações" descricao="As 40 mais recentes do período." tabela={undefined}>
          {a.recentes.length ? (
            <TabelaDados
              legenda="Últimas alterações"
              limite={10}
              colunas={[{ id: 'q', titulo: 'Quando' }, { id: 'a', titulo: 'Alteração' }, { id: 'i', titulo: 'Imóvel' }, { id: 'p', titulo: 'Quem' }]}
              linhas={a.recentes.map((x) => ({ q: { v: x.em, t: dataHora(x.em) }, a: ROTULO_ACAO[x.acao] ?? x.acao, i: x.imovel && x.imovelId ? { v: x.imovel, href: `/admin/imoveis/${x.imovelId}` } : (x.imovel ?? '—'), p: x.autor }))}
              ordem={{ coluna: 'q', decrescente: true }}
            />
          ) : <Vazio titulo="Nenhuma alteração neste período" />}
        </Cartao>
      </div>
    </>
  )
}
