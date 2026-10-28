import Link from 'next/link'
import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, BarraEmpilhada, GraficoLinha, Legenda, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { comparar, pontosDeLinha, taxas } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { Icone } from '@/components/ui/Icone'
import { porDimensao, serieDiaria, somar } from '@/lib/relatorios/audiencia'
import { qualidadeDoCadastro, resumoDoCatalogo } from '@/lib/relatorios/catalogo'
import { fmtDuracao, fmtInt, fmtPct, variacao } from '@/lib/relatorios/formato'
import { contatosDe, desempenhoDosImoveis } from '@/lib/relatorios/imoveis'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { rotuloAparelho, rotuloCanal } from '@/lib/relatorios/rotulos'

export default function PaginaVisaoGeral({ searchParams }: PageProps<'/admin/relatorios'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} comparavel arquivo="visao-geral">
      {(ctx) => <VisaoGeral ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const CORES_APARELHO: Record<string, string> = { celular: 'var(--g-1)', computador: 'var(--g-2)', tablet: 'var(--g-3)', desconhecido: 'var(--g-anterior)' }

async function VisaoGeral({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo, anterior, comparar: comp } = ctx
  const [atual, antes, catalogo, imoveis, canais, aparelhos, buscas, naoEncontradas, qualidade] = await Promise.all([
    serieDiaria(periodo),
    comp ? serieDiaria(anterior) : Promise.resolve(null),
    resumoDoCatalogo(),
    desempenhoDosImoveis(periodo),
    porDimensao(periodo, 'canal'),
    porDimensao(periodo, 'dispositivo'),
    porDimensao(periodo, 'busca', { ordem: 'eventos' }),
    porDimensao(periodo, 'nao-encontrada', { ordem: 'eventos' }),
    qualidadeDoCadastro(0),
  ])
  const t = somar(atual)
  const ta = antes ? somar(antes) : null
  const tx = taxas(t)
  const txa = ta ? taxas(ta) : null
  const temDados = t.sessoes > 0

  const maisVistos = [...imoveis].filter((i) => i.visitas > 0).sort((a, b) => b.visitas - a.visitas).slice(0, 8)
  const maisContatos = [...imoveis].filter((i) => contatosDe(i) > 0).sort((a, b) => contatosDe(b) - contatosDe(a) || b.visitas - a.visitas).slice(0, 8)
  const semContato = imoveis.filter((i) => i.status === 'ativo' && i.sessoes >= 15 && i.conversoes === 0).length
  const semVisita = imoveis.filter((i) => i.status === 'ativo' && i.visitas === 0).length
  const semResultado = buscas.find((b) => b.chave === 'sem-resultado')?.eventos ?? 0
  const totalBuscas = buscas.find((b) => b.chave === 'total')?.eventos ?? 0
  const n404 = naoEncontradas.reduce((a, b) => a + b.eventos, 0)
  const problemas = qualidade.itens.filter((i) => i.falhas > 0).sort((a, b) => b.falhas - a.falhas)

  const atencoes = [
    ...(temDados && semContato ? [{ n: semContato, texto: 'imóveis com bastante visita e nenhum contato no período. Vale rever preço, fotos e descrição.', href: '/admin/relatorios/imoveis' }] : []),
    ...(temDados && semVisita ? [{ n: semVisita, texto: 'imóveis ativos que ninguém abriu no período.', href: '/admin/relatorios/imoveis' }] : []),
    ...(semResultado ? [{ n: semResultado, texto: `buscas sem nenhum imóvel (${fmtPct(semResultado / Math.max(1, totalBuscas), 0)} das buscas com filtro): é a demanda que o catálogo não atende.`, href: '/admin/relatorios/buscas' }] : []),
    ...(n404 ? [{ n: n404, texto: 'acessos a páginas que não existem (links quebrados ou imóveis que saíram do ar).', href: '/admin/relatorios/paginas' }] : []),
    ...problemas.slice(0, 3).map((p) => ({ n: p.falhas, texto: `imóveis ativos: ${p.titulo.toLowerCase()}.`, href: '/admin/relatorios/qualidade' })),
  ]

  const kpis = [
    { rotulo: 'Visitas', valor: fmtInt(t.visitas), v: comparar(t.visitas, ta?.visitas), serie: atual.map((p) => p.visitas), nota: 'Páginas vistas' },
    { rotulo: 'Visitantes', valor: fmtInt(t.visitantes), v: comparar(t.visitantes, ta?.visitantes), serie: atual.map((p) => p.visitantes), nota: 'Soma dos visitantes de cada dia' },
    { rotulo: 'Sessões', valor: fmtInt(t.sessoes), v: comparar(t.sessoes, ta?.sessoes), serie: atual.map((p) => p.sessoes) },
    { rotulo: 'Contatos', valor: fmtInt(t.conversoes), v: comparar(t.conversoes, ta?.conversoes), serie: atual.map((p) => p.conversoes), nota: 'Sessões com WhatsApp, ligação, e-mail ou formulário' },
    { rotulo: 'Taxa de contato', valor: fmtPct(tx.conversao), v: txa ? variacao(tx.conversao, txa.conversao) : undefined, nota: 'Contatos ÷ sessões' },
    { rotulo: 'Rejeição', valor: fmtPct(tx.rejeicao), v: txa ? variacao(tx.rejeicao, txa.rejeicao) : undefined, sobe: false, nota: 'Saíram sem interagir' },
    { rotulo: 'Tempo por sessão', valor: fmtDuracao(tx.duracao), v: txa ? variacao(tx.duracao, txa.duracao) : undefined, nota: 'Tempo ativo nas páginas' },
  ]

  return (
    <>
      <GradeKpi titulo="Indicadores do site" itens={kpis.map((k) => ({ rotulo: k.rotulo, valor: k.valor }))}>
        {kpis.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} variacao={k.v} subeEBom={k.sobe !== false} nota={k.nota} serie={k.serie} />
        ))}
      </GradeKpi>

      <GradeKpi
        titulo="Indicadores do cadastro"
        itens={[
          { rotulo: 'Imóveis ativos', valor: fmtInt(catalogo.imoveis.ativos) },
          { rotulo: 'Construtoras com imóveis', valor: fmtInt(catalogo.construtoras.comImoveis) },
          { rotulo: 'Cidades', valor: fmtInt(catalogo.local.cidades) },
          { rotulo: 'Bairros', valor: fmtInt(catalogo.local.bairros) },
          { rotulo: 'Fotos', valor: fmtInt(catalogo.midia.fotos) },
          { rotulo: 'Na vitrine', valor: fmtInt(catalogo.imoveis.naVitrine) },
        ]}
      >
        <Kpi rotulo="Imóveis ativos" valor={fmtInt(catalogo.imoveis.ativos)} nota={`${fmtInt(catalogo.imoveis.venda)} à venda · ${fmtInt(catalogo.imoveis.aluguel)} para alugar${catalogo.imoveis.inativos ? ` · ${fmtInt(catalogo.imoveis.inativos)} desativados` : ''}`} />
        <Kpi rotulo="Construtoras" valor={fmtInt(catalogo.construtoras.comImoveis)} nota={`${fmtInt(catalogo.construtoras.total)} cadastradas`} />
        <Kpi rotulo="Cidades" valor={fmtInt(catalogo.local.cidades)} nota={`${fmtInt(catalogo.local.bairros)} bairros`} />
        <Kpi rotulo="Fotos" valor={fmtInt(catalogo.midia.fotos)} nota={`${(catalogo.midia.fotos / Math.max(1, catalogo.imoveis.ativos)).toFixed(1).replace('.', ',')} por imóvel`} />
        <Kpi rotulo="Lançamentos" valor={fmtInt(catalogo.imoveis.lancamentos)} nota={`${fmtInt(catalogo.imoveis.mcmv)} no Minha Casa Minha Vida`} />
        <Kpi rotulo="Na vitrine da home" valor={fmtInt(catalogo.imoveis.naVitrine)} />
      </GradeKpi>

      {atencoes.length > 0 && (
        <section className={s.cartao} data-cartao data-titulo="Pontos de atenção">
          <div className={s.cartaoTitulos}>
            <h2>Pontos de atenção</h2>
            <p>O que merece uma olhada primeiro, calculado com os números do período.</p>
          </div>
          <ul className={s.atencoes}>
            {atencoes.map((a) => (
              <li key={a.texto}>
                <Link href={a.href}>
                  <b>{fmtInt(a.n)}</b>
                  <span>{a.texto}</span>
                  <Icone nome="chevron-direita" tamanho={18} />
                </Link>
              </li>
            ))}
          </ul>
          <table hidden>
            <thead><tr><th>Ponto de atenção</th><th>Quantidade</th></tr></thead>
            <tbody>{atencoes.map((a) => <tr key={a.texto}><th>{a.texto}</th><td data-v={a.n}>{a.n}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <div className={s.grade}>
        <Cartao
          titulo="Visitas por dia"
          descricao="Páginas vistas a cada dia."
          tabela={
            <TabelaDados
              legenda="Visitas por dia"
              limite={15}
              ordem={{ coluna: 'dia', decrescente: true }}
              colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'visitas', titulo: 'Visitas', numerica: true }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]}
              linhas={atual.map((p) => ({ dia: { v: p.dia, t: p.dia.split('-').reverse().join('/') }, visitas: p.visitas, sessoes: p.sessoes, contatos: p.conversoes }))}
            />
          }
        >
          {periodo.dias < 2 ? (
            <Vazio titulo="Escolha um período com mais de um dia" texto="A evolução por dia precisa de pelo menos dois dias." />
          ) : (
            <>
              <GraficoLinha pontos={pontosDeLinha(atual, antes, (p) => p.visitas)} formato={fmtInt} nomeSerie="Visitas" />
              {antes && <Legenda itens={[{ rotulo: 'Período escolhido', cor: 'var(--g-acento)', forma: 'linha' }, { rotulo: 'Período anterior', cor: 'var(--g-anterior)', forma: 'linha' }]} />}
            </>
          )}
        </Cartao>

        <Cartao
          titulo="Contatos por dia"
          descricao="Sessões que terminaram em WhatsApp, ligação, e-mail ou formulário enviado."
          tabela={
            <TabelaDados
              legenda="Contatos por dia"
              limite={15}
              ordem={{ coluna: 'dia', decrescente: true }}
              colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'contatos', titulo: 'Contatos', numerica: true }]}
              linhas={atual.map((p) => ({ dia: { v: p.dia, t: p.dia.split('-').reverse().join('/') }, contatos: p.conversoes }))}
            />
          }
        >
          {periodo.dias < 2 ? (
            <Vazio titulo="Escolha um período com mais de um dia" />
          ) : (
            <>
              <GraficoLinha pontos={pontosDeLinha(atual, antes, (p) => p.conversoes)} formato={fmtInt} nomeSerie="Contatos" />
              {antes && <Legenda itens={[{ rotulo: 'Período escolhido', cor: 'var(--g-acento)', forma: 'linha' }, { rotulo: 'Período anterior', cor: 'var(--g-anterior)', forma: 'linha' }]} />}
            </>
          )}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Imóveis mais vistos"
          descricao="Páginas vistas no período."
          rodape={<Link href="/admin/relatorios/imoveis">Ver todos os imóveis</Link>}
          tabela={<TabelaDados legenda="Imóveis mais vistos" limite={8} colunas={[{ id: 'nome', titulo: 'Imóvel' }, { id: 'visitas', titulo: 'Visitas', numerica: true }]} linhas={maisVistos.map((i) => ({ nome: i.nome, visitas: i.visitas }))} ordem={{ coluna: 'visitas', decrescente: true }} />}
        >
          {maisVistos.length ? (
            <Barras itens={maisVistos.map((i) => ({ rotulo: i.nome, sub: `${i.bairro}, ${i.cidade}`, valor: i.visitas, href: i.slug ? `/imovel/${i.slug}` : undefined, extras: [['Contatos', fmtInt(contatosDe(i))]] }))} formato={fmtInt} />
          ) : (
            <Vazio titulo="Sem visitas a imóveis neste período" />
          )}
        </Cartao>

        <Cartao
          titulo="Imóveis que mais geraram contato"
          descricao="WhatsApp, ligações, e-mails e formulários feitos a partir da página do imóvel."
          tabela={<TabelaDados legenda="Imóveis com mais contatos" limite={8} colunas={[{ id: 'nome', titulo: 'Imóvel' }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={maisContatos.map((i) => ({ nome: i.nome, contatos: contatosDe(i) }))} ordem={{ coluna: 'contatos', decrescente: true }} />}
        >
          {maisContatos.length ? (
            <Barras itens={maisContatos.map((i) => ({ rotulo: i.nome, sub: `${i.bairro}, ${i.cidade}`, valor: contatosDe(i), href: i.slug ? `/imovel/${i.slug}` : undefined, extras: [['Visitas', fmtInt(i.visitas)]] }))} formato={fmtInt} />
          ) : (
            <Vazio titulo="Nenhum contato registrado neste período" />
          )}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="De onde vêm as visitas"
          descricao="Sessões por canal de entrada."
          rodape={<Link href="/admin/relatorios/origens">Ver origens, campanhas e sites de referência</Link>}
          tabela={<TabelaDados legenda="Sessões por canal" colunas={[{ id: 'canal', titulo: 'Canal' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={canais.map((c) => ({ canal: rotuloCanal[c.chave] ?? c.chave, sessoes: c.sessoes, contatos: c.conversoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {canais.length ? (
            <Barras itens={canais.map((c) => ({ rotulo: rotuloCanal[c.chave] ?? c.chave, valor: c.sessoes, extras: [['Contatos', fmtInt(c.conversoes)]] }))} formato={fmtInt} />
          ) : (
            <Vazio titulo="Sem sessões neste período" />
          )}
        </Cartao>

        <Cartao
          titulo="Aparelhos"
          descricao="Como as pessoas acessam o site."
          tabela={<TabelaDados legenda="Sessões por aparelho" colunas={[{ id: 'aparelho', titulo: 'Aparelho' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={aparelhos.map((a) => ({ aparelho: rotuloAparelho[a.chave] ?? a.chave, sessoes: a.sessoes }))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {aparelhos.length ? (
            <BarraEmpilhada segmentos={aparelhos.map((a) => ({ rotulo: rotuloAparelho[a.chave] ?? a.chave, valor: a.sessoes, cor: CORES_APARELHO[a.chave] ?? 'var(--g-anterior)' }))} formato={fmtInt} />
          ) : (
            <Vazio titulo="Sem sessões neste período" />
          )}
        </Cartao>
      </div>
    </>
  )
}
