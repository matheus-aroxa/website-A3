import Link from 'next/link'
import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, GraficoLinha, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { pontosDeLinha, taxas } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { Icone } from '@/components/ui/Icone'
import { porDimensao, serieDiaria, somar } from '@/lib/relatorios/audiencia'
import { resumoDoCatalogo } from '@/lib/relatorios/catalogo'
import { fmtDuracao, fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import { contatosDe, desempenhoDosImoveis } from '@/lib/relatorios/imoveis'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { rotuloCanal } from '@/lib/relatorios/rotulos'

export default function PaginaVisaoGeral({ searchParams }: PageProps<'/admin/relatorios'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams}>
      {(ctx) => <VisaoGeral ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

async function VisaoGeral({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [atual, catalogo, imoveis, canais, buscas, naoEncontradas] = await Promise.all([
    serieDiaria(periodo),
    resumoDoCatalogo(),
    desempenhoDosImoveis(periodo),
    porDimensao(periodo, 'canal'),
    porDimensao(periodo, 'busca', { ordem: 'eventos' }),
    porDimensao(periodo, 'nao-encontrada', { ordem: 'eventos' }),
  ])
  const t = somar(atual)
  const tx = taxas(t)
  const temDados = t.sessoes > 0

  const maisVistos = [...imoveis].filter((i) => i.visitas > 0).sort((a, b) => b.visitas - a.visitas).slice(0, 8)
  const maisContatos = [...imoveis].filter((i) => contatosDe(i) > 0).sort((a, b) => contatosDe(b) - contatosDe(a) || b.visitas - a.visitas).slice(0, 8)
  const semContato = imoveis.filter((i) => i.status === 'ativo' && i.sessoes >= 15 && i.conversoes === 0).length
  const semVisita = imoveis.filter((i) => i.status === 'ativo' && i.visitas === 0).length
  const semResultado = buscas.find((b) => b.chave === 'sem-resultado')?.eventos ?? 0
  const totalBuscas = buscas.find((b) => b.chave === 'total')?.eventos ?? 0
  const n404 = naoEncontradas.reduce((a, b) => a + b.eventos, 0)

  const atencoes = [
    ...(temDados && semContato ? [{ n: semContato, texto: 'imóveis com bastante visita e nenhum contato no período. Vale rever preço, fotos e descrição.', href: '/admin/relatorios/imoveis' }] : []),
    ...(temDados && semVisita ? [{ n: semVisita, texto: 'imóveis ativos que ninguém abriu no período.', href: '/admin/relatorios/imoveis' }] : []),
    ...(semResultado ? [{ n: semResultado, texto: `buscas sem nenhum imóvel (${fmtPct(semResultado / Math.max(1, totalBuscas), 0)} das buscas com filtro): é a demanda que o catálogo não atende.`, href: '/admin/relatorios/buscas' }] : []),
    ...(n404 ? [{ n: n404, texto: 'acessos a páginas que não existem (links quebrados ou imóveis que saíram do ar).', href: '/admin/relatorios/paginas' }] : []),
  ]

  const kpis = [
    { rotulo: 'Visitas', valor: fmtInt(t.visitas), nota: 'Páginas abertas no site. Quem abre 5 páginas soma 5 visitas.' },
    { rotulo: 'Visitantes', valor: fmtInt(t.visitantes), nota: 'Pessoas diferentes em cada dia, somadas. Quem volta em outro dia conta de novo.' },
    { rotulo: 'Sessões', valor: fmtInt(t.sessoes), nota: 'Cada vez que alguém entra no site. Depois de 30 min parado, a próxima entrada é outra sessão.' },
    { rotulo: 'Contatos', valor: fmtInt(t.conversoes), nota: 'Sessões com pelo menos um clique no WhatsApp ou formulário enviado.' },
    { rotulo: 'Taxa de contato', valor: fmtPct(tx.conversao), nota: 'Contatos ÷ sessões' },
    { rotulo: 'Tempo por sessão', valor: fmtDuracao(tx.duracao), nota: 'Tempo médio de cada sessão, contando só quando a página está aberta na tela.' },
    { rotulo: 'Rejeição', valor: fmtPct(tx.rejeicao), nota: 'Sessões em que a pessoa viu uma página só, não interagiu e saiu em menos de 10 s.' },
  ]

  const ativos = catalogo.imoveis.ativos
  const kpisDoCatalogo = [
    { rotulo: 'Imóveis ativos', valor: fmtInt(ativos), nota: `${fmtInt(catalogo.imoveis.venda)} à venda · ${fmtInt(catalogo.imoveis.aluguel)} para alugar${catalogo.imoveis.inativos ? ` · ${fmtInt(catalogo.imoveis.inativos)} desativados` : ''}` },
    { rotulo: 'Lançamentos', valor: fmtInt(catalogo.imoveis.lancamentos), nota: `${fmtPct(razao(catalogo.imoveis.lancamentos, catalogo.imoveis.venda), 0)} dos imóveis à venda` },
    { rotulo: 'Minha Casa Minha Vida', valor: fmtInt(catalogo.imoveis.mcmv), nota: `${fmtPct(razao(catalogo.imoveis.mcmv, ativos), 0)} dos imóveis` },
    { rotulo: 'Construtoras', valor: fmtInt(catalogo.construtoras.comImoveis), nota: `${fmtInt(catalogo.construtoras.total)} cadastradas${catalogo.construtoras.semImoveis ? ` · ${catalogo.construtoras.semImoveis} sem imóvel` : ''}` },
    { rotulo: 'Cidades', valor: fmtInt(catalogo.local.cidades), nota: `${fmtInt(catalogo.local.bairros)} bairros` },
    { rotulo: 'Fotos', valor: fmtInt(catalogo.midia.fotos), nota: `${(catalogo.midia.fotos / Math.max(1, ativos)).toFixed(1).replace('.', ',')} por imóvel` },
    { rotulo: 'Na vitrine da home', valor: fmtInt(catalogo.imoveis.naVitrine), nota: 'Imóveis em destaque na página inicial' },
  ]

  return (
    <>
      <GradeKpi>
        {kpis.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} nota={k.nota} />
        ))}
      </GradeKpi>

      <GradeKpi>
        {kpisDoCatalogo.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} nota={k.nota} />
        ))}
      </GradeKpi>

      {atencoes.length > 0 && (
        <section className={s.cartao}>
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
            <GraficoLinha pontos={pontosDeLinha(atual, (p) => p.visitas)} formato={fmtInt} nomeSerie="Visitas" />
          )}
        </Cartao>

        <Cartao
          titulo="Contatos por dia"
          descricao="Sessões que terminaram em WhatsApp ou formulário enviado."
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
            <GraficoLinha pontos={pontosDeLinha(atual, (p) => p.conversoes)} formato={fmtInt} nomeSerie="Contatos" />
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
          descricao="WhatsApp e formulários enviados a partir da página do imóvel."
          tabela={<TabelaDados legenda="Imóveis com mais contatos" limite={8} colunas={[{ id: 'nome', titulo: 'Imóvel' }, { id: 'contatos', titulo: 'Contatos', numerica: true }]} linhas={maisContatos.map((i) => ({ nome: i.nome, contatos: contatosDe(i) }))} ordem={{ coluna: 'contatos', decrescente: true }} />}
        >
          {maisContatos.length ? (
            <Barras itens={maisContatos.map((i) => ({ rotulo: i.nome, sub: `${i.bairro}, ${i.cidade}`, valor: contatosDe(i), href: i.slug ? `/imovel/${i.slug}` : undefined, extras: [['Visitas', fmtInt(i.visitas)]] }))} formato={fmtInt} />
          ) : (
            <Vazio titulo="Nenhum contato registrado neste período" />
          )}
        </Cartao>
      </div>

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
    </>
  )
}
