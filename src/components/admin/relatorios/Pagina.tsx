// Estrutura comum das páginas de relatórios: barra de período, aviso sobre a medição e o conteúdo.
import { Suspense, type ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import { CorpoPagina } from '@/components/admin/TopoPagina'
import { contextoDoRelatorio, tabelasAusentes, type ContextoDoRelatorio, type ParametrosDaPagina } from '@/lib/relatorios/pagina'
import { formatarDia } from '@/lib/relatorios/periodo'
import { BarraDoRelatorio } from './BarraDoRelatorio'
import s from './Relatorios.module.css'

function Aviso({ ctx, usaPeriodo }: { ctx: ContextoDoRelatorio; usaPeriodo: boolean }) {
  if (!usaPeriodo || !ctx.primeiroDia) return null
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
  children,
}: {
  parametros: ParametrosDaPagina
  usaPeriodo: boolean
  medicao: boolean
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
        {usaPeriodo && <BarraDoRelatorio periodo={ctx.periodo} hoje={ctx.hoje} />}
        <Aviso ctx={ctx} usaPeriodo={usaPeriodo && medicao} />
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
            página. O passo a passo está em <code>docs/relatorios.md</code>. A aba Catálogo funciona sem isso.
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
  children,
}: {
  parametros: ParametrosDaPagina
  usaPeriodo?: boolean
  /** A página usa os números de visita (o padrão quando há período). */
  medicao?: boolean
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
      <Conteudo parametros={parametros} usaPeriodo={usaPeriodo} medicao={medicao}>
        {children}
      </Conteudo>
    </Suspense>
  )
}
