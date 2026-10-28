// Gráficos dos relatórios: SVG e HTML gerados no servidor, sem biblioteca. Cada marca leva `data-dica` (a dica do cartão) e todo
// gráfico tem a versão em tabela no cartão. Cores: --g-acento para uma série só; --g-1..4 só onde há categorias de verdade.
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { Icone } from '@/components/ui/Icone'
import { fmtPct } from '@/lib/relatorios/formato'
import { dica } from './dica'
import s from './Relatorios.module.css'

const cor = (c: string): CSSProperties => ({ ['--cor' as string]: c })

// ---------- Escala ----------

/** Máximo "redondo" do eixo e os valores das linhas de grade (0 a máximo). */
export function escala(maximo: number, divisoes = 4) {
  if (maximo <= 0) return { max: 1, marcas: [0, 1] }
  const bruto = maximo / divisoes
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const passo = ([1, 2, 2.5, 5, 10].find((m) => m * potencia >= bruto) ?? 10) * potencia
  const max = Math.ceil(maximo / passo) * passo
  return { max, marcas: Array.from({ length: Math.round(max / passo) + 1 }, (_, i) => i * passo) }
}

// ---------- Legenda ----------

export interface ItemLegenda {
  rotulo: string
  cor: string
  forma?: 'linha'
}

export function Legenda({ itens }: { itens: ItemLegenda[] }) {
  return (
    <div className={s.legenda}>
      {itens.map((i) => (
        <span key={i.rotulo} className={s.legendaItem}>
          <i className={s.chave} data-forma={i.forma} style={cor(i.cor)} />
          {i.rotulo}
        </span>
      ))}
    </div>
  )
}

// ---------- Linha ----------

export interface PontoDeLinha {
  /** Rótulo curto do eixo (ex.: "12/10"). */
  rotulo: string
  /** Rótulo da dica (ex.: "seg, 12/10/2026"). */
  rotuloLongo: string
  valor: number
}

export function GraficoLinha({
  pontos,
  formato,
  formatoEixo,
  nomeSerie,
  altura = 240,
}: {
  pontos: PontoDeLinha[]
  formato: (n: number) => string
  formatoEixo?: (n: number) => string
  nomeSerie: string
  altura?: number
}) {
  const n = pontos.length
  const { max, marcas } = escala(Math.max(0, ...pontos.map((p) => p.valor)))
  const x = (i: number) => ((i + 0.5) / n) * 1000
  const y = (v: number) => 100 - (v / max) * 100
  const caminho = (valores: number[]) => valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(2)}`).join(' ')
  const principal = caminho(pontos.map((p) => p.valor))
  const area = `${principal} L${x(n - 1).toFixed(1)},100 L${x(0).toFixed(1)},100 Z`
  // Uns 6 rótulos no eixo X, espalhados; o penúltimo some se ficaria colado no último.
  const passoX = Math.max(1, Math.ceil(n / 6))
  const rotulosX = pontos.map((p, i) => ({ p, i })).filter(({ i }) => i % passoX === 0 || i === n - 1).filter(({ i }) => i === n - 1 || n - 1 - i >= passoX)

  return (
    <div className={s.linha} style={{ ['--altura' as string]: `${altura}px` }}>
      <div className={s.linhaY} aria-hidden="true">
        {marcas.map((m) => (
          <span key={m} style={{ bottom: `${(m / max) * 100}%` }}>
            {(formatoEixo ?? formato)(m)}
          </span>
        ))}
      </div>
      <div className={s.linhaArea}>
        <svg className={s.linhaMarcas} viewBox="0 0 1000 100" preserveAspectRatio="none" role="img" aria-label={`${nomeSerie} por dia`}>
          {marcas.map((m, i) => (
            <line key={m} className={i === 0 ? 'grade0' : 'gradeN'} x1="0" x2="1000" y1={y(m)} y2={y(m)} stroke={i === 0 ? 'var(--g-eixo)' : 'var(--g-grade)'} strokeWidth="1" />
          ))}
          <path d={area} fill="var(--g-acento-area)" />
          <path d={principal} fill="none" stroke="var(--g-acento)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className={s.linhaColunas}>
          {pontos.map((p) => (
            <div
              key={p.rotuloLongo}
              className={s.linhaColuna}
              tabIndex={n <= 62 ? 0 : undefined}
              aria-label={`${p.rotuloLongo}: ${formato(p.valor)}`}
              data-dica={dica({
                t: p.rotuloLongo,
                l: [[nomeSerie, formato(p.valor), 'var(--g-acento)']],
              })}
            >
              <span className={s.linhaCruz} />
              <span className={s.linhaPonto} style={{ bottom: `${(p.valor / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className={s.linhaX} aria-hidden="true">
        {rotulosX.map(({ p, i }) => (
          <span key={i} style={{ left: `${x(i) / 10}%` }}>
            {p.rotulo}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------- Barras horizontais ----------

export interface ItemDeBarra {
  rotulo: ReactNode
  /** Texto da dica e da tabela quando o rótulo não é texto. */
  nome?: string
  valor: number
  texto?: string
  sub?: string
  href?: string
  /** Linhas extras da dica: [nome, valor]. */
  extras?: [string, string][]
  esmaecida?: boolean
}

export function Barras({ itens, formato, cor: cabecalho = 'var(--g-acento)', maximo }: { itens: ItemDeBarra[]; formato: (n: number) => string; cor?: string; maximo?: number }) {
  const max = maximo ?? Math.max(1e-9, ...itens.map((i) => i.valor))
  return (
    <ul className={s.barras}>
      {itens.map((i, k) => (
        <li
          key={k}
          className={s.barraItem}
          data-esmaecida={i.esmaecida || undefined}
          tabIndex={0}
          data-dica={dica({ t: i.nome ?? (typeof i.rotulo === 'string' ? i.rotulo : undefined), l: [['Total', i.texto ?? formato(i.valor), cabecalho], ...(i.extras ?? [])] })}
        >
          <span className={s.barraRotulo}>
            {i.href ? <Link href={i.href}>{i.rotulo}</Link> : i.rotulo}
            {i.sub && <small>{i.sub}</small>}
          </span>
          <span className={s.barraTrilho}>
            <i className={s.barraMarca} style={{ ...cor(cabecalho), ['--p' as string]: Math.max(0, i.valor) / max }} />
            <span className={s.barraValor}>{i.texto ?? formato(i.valor)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------- Barra empilhada (parte de um todo) ----------

export interface Segmento {
  rotulo: string
  valor: number
  cor: string
  /** Texto escuro sobre cores claras (amarelo). */
  escuro?: boolean
}

export function BarraEmpilhada({ segmentos, formato }: { segmentos: Segmento[]; formato: (n: number) => string }) {
  const visiveis = segmentos.filter((x) => x.valor > 0)
  const total = visiveis.reduce((a, b) => a + b.valor, 0)
  if (!total) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className={s.empilhada} role="img" aria-label={visiveis.map((x) => `${x.rotulo}: ${formato(x.valor)}`).join(', ')}>
        {visiveis.map((x) => (
          <div
            key={x.rotulo}
            className={s.segmento}
            style={{ ...cor(x.cor), ['--v' as string]: x.valor }}
            data-texto={x.escuro ? 'escuro' : undefined}
            tabIndex={0}
            data-dica={dica({ t: x.rotulo, l: [['Quantidade', formato(x.valor), x.cor], ['Participação', fmtPct(x.valor / total)]] })}
          >
            {x.valor / total >= 0.12 ? fmtPct(x.valor / total, 0) : null}
          </div>
        ))}
      </div>
      <ul className={s.legendaTabela}>
        {visiveis.map((x) => (
          <li key={x.rotulo}>
            <i className={s.chave} style={cor(x.cor)} />
            <span>{x.rotulo}</span>
            <span className="num" style={{ fontWeight: 700 }}>{formato(x.valor)}</span>
            <span className={s.pct}>{fmtPct(x.valor / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Colunas ----------

export interface ItemDeColuna {
  rotulo: string
  nome?: string
  valor: number
  texto?: string
}

export function Colunas({ itens, formato, altura = 200, cor: c = 'var(--g-acento)', valores = true }: { itens: ItemDeColuna[]; formato: (n: number) => string; altura?: number; cor?: string; valores?: boolean }) {
  const max = Math.max(1e-9, ...itens.map((i) => i.valor))
  const mostrarValores = valores && itens.length <= 16
  return (
    <div>
      <div className={s.colunas} style={{ ['--altura' as string]: `${altura}px` }}>
        {itens.map((i, k) => (
          <div key={k} className={s.colunasItem} tabIndex={0} aria-label={`${i.nome ?? i.rotulo}: ${i.texto ?? formato(i.valor)}`} data-dica={dica({ t: i.nome ?? i.rotulo, l: [['Total', i.texto ?? formato(i.valor), c]] })}>
            {mostrarValores && <span className={s.colunasValor}>{i.texto ?? formato(i.valor)}</span>}
            <i className={s.colunasMarca} style={{ ...cor(c), ['--p' as string]: i.valor / max }} />
          </div>
        ))}
      </div>
      <div className={s.colunasRotulos} aria-hidden="true">
        {itens.map((i, k) => (
          <span key={k}>{i.rotulo}</span>
        ))}
      </div>
    </div>
  )
}

// ---------- Mapa de calor ----------

export function MapaDeCalor({ grade, diasDaSemana, formato }: { grade: number[][]; diasDaSemana: string[]; formato: (n: number) => string }) {
  const max = Math.max(1, ...grade.flat())
  const nivel = (v: number) => (v <= 0 ? 'var(--g-trilho)' : `var(--s-${1 + Math.round((v / max) * 7)})`)
  return (
    <div>
      <div className={s.calor} role="img" aria-label="Visitas por dia da semana e hora">
        {grade.map((linha, d) => (
          <div key={d} style={{ display: 'contents' }}>
            <span className={s.calorDia}>{diasDaSemana[d]}</span>
            {linha.map((v, h) => (
              <i
                key={h}
                className={s.calorCelula}
                style={{ ['--c' as string]: nivel(v) }}
                tabIndex={-1}
                data-dica={dica({ t: `${diasDaSemana[d]}, ${String(h).padStart(2, '0')}h às ${String(h + 1).padStart(2, '0')}h`, l: [['Visitas', formato(v), 'var(--s-6)']] })}
              />
            ))}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} style={{ fontSize: 11, textAlign: 'center', color: 'var(--g-mudo)' }}>
            {h % 3 === 0 ? h : ''}
          </span>
        ))}
      </div>
      <div className={s.calorEscala} style={{ marginTop: 12 }}>
        <span>Menos</span>
        <i />
        <span>Mais visitas</span>
      </div>
    </div>
  )
}

// ---------- Funil ----------

export interface EtapaDoFunil {
  rotulo: string
  valor: number
  nota?: string
}

/** Etapas em ordem; cada barra é proporcional à primeira. Tons do mesmo verde, do claro (início) ao escuro (fim). */
export function Funil({ etapas, formato }: { etapas: EtapaDoFunil[]; formato: (n: number) => string }) {
  const base = Math.max(1, etapas[0]?.valor ?? 1)
  const tons = ['var(--s-4)', 'var(--s-5)', 'var(--s-6)', 'var(--s-7)', 'var(--s-8)']
  return (
    <ol className={s.funil}>
      {etapas.map((e, i) => {
        const anterior = etapas[i - 1]?.valor
        return (
          <li
            key={e.rotulo}
            className={s.funilEtapa}
            tabIndex={0}
            data-dica={dica({
              t: e.rotulo,
              l: [['Sessões', formato(e.valor), tons[i]], ['Do total', fmtPct(e.valor / base)], ...(anterior ? ([['Da etapa anterior', fmtPct(e.valor / anterior)]] as [string, string][]) : [])],
            })}
          >
            <div className={s.funilTopo}>
              <span>{e.rotulo}</span>
              <strong>
                {formato(e.valor)} <span style={{ fontWeight: 500, color: 'var(--g-mudo)' }}>· {fmtPct(e.valor / base)}</span>
              </strong>
            </div>
            <i className={s.funilBarra} style={{ ...cor(tons[Math.min(i, tons.length - 1)]!), ['--p' as string]: e.valor / base }} />
            {e.nota && <span className={s.funilNota}>{e.nota}</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function Vazio({ titulo, texto }: { titulo: string; texto?: ReactNode }) {
  return (
    <div className={s.vazio}>
      <Icone nome="grafico" tamanho={26} />
      <strong>{titulo}</strong>
      {texto && <span>{texto}</span>}
    </div>
  )
}
