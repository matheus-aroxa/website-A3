// Estrutura comum das páginas de relatórios: barra de período, aviso sobre a medição e o conteúdo.
import { Suspense, type ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import { CorpoPagina } from '@/components/admin/TopoPagina'
import { contextoDoRelatorio, tabelasAusentes, type ContextoDoRelatorio, type ParametrosDaPagina } from '@/lib/relatorios/pagina'
import { formatarDia } from '@/lib/relatorios/periodo'
import { BarraDoRelatorio } from './BarraDoRelatorio'
import s from './Relatorios.module.css'

function Aviso({ ctx, usaPeriodo, comparavel }: { ctx: ContextoDoRelatorio; usaPeriodo: boolean; comparavel: boolean }) {
  if (!usaPeriodo) return null
  if (!ctx.primeiroDia) {
    return (
      <p className={s.aviso} data-tom="atencao">
        <Icone nome="alerta" tamanho={20} />
        <span>
          <strong>A medição ainda não registrou visitas.</strong>{' '}
          {ctx.medicaoLigada
            ? 'Ela conta as visitas a partir do momento em que esta versão do site foi publicada; os números aparecem aqui assim que as primeiras chegarem.'
            : 'Ela só roda no site publicado (não em prévias nem no computador de desenvolvimento). Os números aparecem aqui quando houver visitas no site de verdade.'}{' '}
          Os dados de cadastro (imóveis, construtoras, qualidade) já estão disponíveis nas abas Catálogo e Qualidade.
        </span>
      </p>
    )
  }
  if (comparavel && ctx.compararPedido && !ctx.comparar) {
    return (
      <p className={s.aviso}>
        <Icone nome="historico" tamanho={20} />
        <span>
          <strong>Sem comparação com o período anterior.</strong> A medição começou em {formatarDia(ctx.primeiroDia)} e o período anterior começa em {formatarDia(ctx.anterior.de)}, antes dela.
          {ctx.primeiroDia > ctx.periodo.de && ' Os dias do período escolhido anteriores à medição aparecem zerados.'}
        </span>
      </p>
    )
  }
  if (ctx.primeiroDia > ctx.periodo.de) {
    return (
      <p className={s.aviso}>
        <Icone nome="historico" tamanho={20} />
        <span>
          <strong>A medição começou em {formatarDia(ctx.primeiroDia)}.</strong> Antes dessa data o site não registrava visitas, então os dias anteriores aparecem zerados.
        </span>
      </p>
    )
  }
  return null
}

async function Conteudo({
  parametros,
  usaPeriodo,
  medicao,
  comparavel,
  arquivo,
  children,
}: {
  parametros: ParametrosDaPagina
  usaPeriodo: boolean
  medicao: boolean
  comparavel: boolean
  arquivo: string
  children: (ctx: ContextoDoRelatorio) => Promise<ReactNode> | ReactNode
}) {
  let ctx: ContextoDoRelatorio | null = null
  let corpo: ReactNode = null
  try {
    ctx = await contextoDoRelatorio(parametros, medicao)
    corpo = await children(ctx)
  } catch (erro) {
    if (!tabelasAusentes(erro)) throw erro
    ctx = null
  }
  if (!ctx) return <SemTabelas />
  return (
    <CorpoPagina>
      <div className={s.raiz}>
        <BarraDoRelatorio periodo={ctx.periodo} anterior={ctx.anterior} comparar={ctx.compararPedido} efetivo={ctx.comparar} comparavel={comparavel} usaPeriodo={usaPeriodo} nomeArquivo={`${arquivo}${usaPeriodo ? `-${ctx.periodo.de}-a-${ctx.periodo.ate}` : `-${ctx.hoje}`}`} hoje={ctx.hoje} />
        <Aviso ctx={ctx} usaPeriodo={usaPeriodo && medicao} comparavel={comparavel} />
        {corpo}
      </div>
    </CorpoPagina>
  )
}

/** Migração ainda não aplicada: em vez de uma tela de erro, diz o que fazer. */
function SemTabelas() {
  return (
    <CorpoPagina>
      <div className={s.raiz}>
        <p className={s.aviso} data-tom="atencao">
          <Icone nome="alerta" tamanho={20} />
          <span>
            <strong>As tabelas da medição ainda não existem neste banco.</strong> Rode o arquivo <code>db/relatorios.sql</code> no Supabase (SQL Editor) e recarregue a
            página. O passo a passo está em <code>docs/relatorios.md</code>. As abas Catálogo e Qualidade funcionam sem isso.
          </span>
        </p>
      </div>
    </CorpoPagina>
  )
}

export function PaginaDeRelatorio({
  parametros,
  usaPeriodo = true,
  medicao = usaPeriodo,
  comparavel = false,
  arquivo,
  children,
}: {
  parametros: ParametrosDaPagina
  usaPeriodo?: boolean
  /** A página usa os números de visita (o padrão quando há período). */
  medicao?: boolean
  /** A página mostra o período anterior ao lado do escolhido (caixa "Comparar" na barra). */
  comparavel?: boolean
  /** Nome do arquivo CSV (sem extensão). */
  arquivo: string
  children: (ctx: ContextoDoRelatorio) => Promise<ReactNode> | ReactNode
}) {
  return (
    <Suspense
      fallback={
        <CorpoPagina>
          <p style={{ fontSize: 14, color: 'var(--texto-2)' }}>Carregando relatório…</p>
        </CorpoPagina>
      }
    >
      <Conteudo parametros={parametros} usaPeriodo={usaPeriodo} medicao={medicao} comparavel={comparavel} arquivo={arquivo}>
        {children}
      </Conteudo>
    </Suspense>
  )
}
