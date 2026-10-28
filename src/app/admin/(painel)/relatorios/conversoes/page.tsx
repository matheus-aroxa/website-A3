import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Funil, GraficoLinha, Legenda, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { comparar, pontosDeLinha, taxas } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao, serieDiaria, somar } from '@/lib/relatorios/audiencia'
import { fmtInt, fmtPct, razao, variacao } from '@/lib/relatorios/formato'
import { agruparImoveis, desempenhoDosImoveis, faixaDePreco, FAIXAS_DE_PRECO } from '@/lib/relatorios/imoveis'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { rotuloAparelho, rotuloBotaoWhatsApp, rotuloCampo, rotuloCanal, rotuloFormulario } from '@/lib/relatorios/rotulos'

export default function PaginaConversoes({ searchParams }: PageProps<'/admin/relatorios/conversoes'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} comparavel arquivo="conversoes">
      {(ctx) => <Conversoes ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

async function Conversoes({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo, anterior, comparar: comp } = ctx
  const [atual, antes, funil, acoes, canais, aparelhos, errosDeCampo, imoveis] = await Promise.all([
    serieDiaria(periodo),
    comp ? serieDiaria(anterior) : Promise.resolve(null),
    porDimensao(periodo, 'funil', { ordem: 'sessoes' }),
    porDimensao(periodo, 'acao', { ordem: 'eventos', limite: 600 }),
    porDimensao(periodo, 'canal'),
    porDimensao(periodo, 'dispositivo'),
    porDimensao(periodo, 'form-erro-campo', { ordem: 'eventos', limite: 20 }),
    desempenhoDosImoveis(periodo),
  ])
  const t = somar(atual)
  const ta = antes ? somar(antes) : null
  const tx = taxas(t)
  const txa = ta ? taxas(ta) : null

  const soma = (prefixo: string) => acoes.filter((a) => a.chave === prefixo || a.chave.startsWith(`${prefixo}:`)).reduce((n, a) => n + a.eventos, 0)
  const sessoesDe = (prefixo: string) => acoes.filter((a) => a.chave === prefixo || a.chave.startsWith(`${prefixo}:`)).reduce((n, a) => n + a.sessoes, 0)
  const whatsapp = soma('whatsapp')
  const ligacao = soma('ligacao')
  const email = soma('email')
  const enviados = soma('formulario-enviado')
  const etapa = (chave: string) => funil.find((f) => f.chave === chave)?.sessoes ?? 0
  const etapas = [
    { rotulo: 'Sessões no site', valor: etapa('1-sessoes') },
    { rotulo: 'Viram a página de um imóvel', valor: etapa('2-viu-imovel') },
    { rotulo: 'Interagiram com o imóvel', valor: etapa('3-interagiu'), nota: 'Fotos, planta, mapa, compartilhar ou começar a preencher um formulário' },
    { rotulo: 'Entraram em contato', valor: etapa('4-contato'), nota: 'WhatsApp, ligação, e-mail ou formulário enviado' },
  ]
  const semImovel = etapa('5-contato-sem-imovel')
  const botoes = acoes.filter((a) => a.chave.startsWith('whatsapp:')).reduce<Record<string, number>>((m, a) => ({ ...m, [a.chave.slice(9)]: (m[a.chave.slice(9)] ?? 0) + a.eventos }), {})
  const tipos = [
    { rotulo: 'WhatsApp', valor: whatsapp },
    { rotulo: 'Formulário enviado', valor: enviados },
    { rotulo: 'Ligação', valor: ligacao },
    { rotulo: 'E-mail', valor: email },
  ]
  const formularios = Object.keys(rotuloFormulario).map((f) => {
    const sess = (tipo: string) => acoes.filter((a) => a.chave === `${tipo}:${f}`).reduce((n, a) => n + a.sessoes, 0)
    const ev = (tipo: string) => acoes.filter((a) => a.chave === `${tipo}:${f}`).reduce((n, a) => n + a.eventos, 0)
    return { chave: f, iniciados: sess('formulario-iniciado'), enviados: ev('formulario-enviado'), erros: ev('formulario-erro') }
  })
  const porFaixa = FAIXAS_DE_PRECO.map((f) => agruparImoveis(imoveis, (i) => (faixaDePreco(i) === f.rotulo ? f.rotulo : null))[0] ?? { chave: f.rotulo, imoveis: 0, visitas: 0, visitantes: 0, sessoes: 0, conversoes: 0, contatos: 0 })
  const nada = <Vazio titulo="Sem dados neste período" />
  const legendaComparacao = antes ? <Legenda itens={[{ rotulo: 'Período escolhido', cor: 'var(--g-acento)', forma: 'linha' }, { rotulo: 'Período anterior', cor: 'var(--g-anterior)', forma: 'linha' }]} /> : null

  const kpis = [
    { rotulo: 'Contatos', valor: fmtInt(t.conversoes), v: comparar(t.conversoes, ta?.conversoes), serie: atual.map((p) => p.conversoes), nota: 'Sessões com pelo menos um contato' },
    { rotulo: 'Taxa de contato', valor: fmtPct(tx.conversao), v: txa ? variacao(tx.conversao, txa.conversao) : undefined, nota: 'Contatos ÷ sessões' },
    { rotulo: 'Cliques no WhatsApp', valor: fmtInt(whatsapp), nota: `${fmtInt(sessoesDe('whatsapp'))} sessões` },
    { rotulo: 'Formulários enviados', valor: fmtInt(enviados), nota: 'Abrem o WhatsApp com a mensagem pronta' },
    { rotulo: 'Cliques no telefone', valor: fmtInt(ligacao) },
    { rotulo: 'Cliques no e-mail', valor: fmtInt(email) },
  ]

  return (
    <>
      <p className={s.aviso}>
        <span>
          <strong>O que “contato” significa aqui.</strong> O site mede a intenção: o clique no WhatsApp, no telefone ou no e-mail e o formulário enviado. Se a pessoa de fato mandou a mensagem só quem atende no WhatsApp da A3 sabe, e nada de nome, telefone ou mensagem é guardado pelo site.
        </span>
      </p>

      <GradeKpi titulo="Indicadores de contato" itens={kpis.map((k) => ({ rotulo: k.rotulo, valor: k.valor }))}>
        {kpis.map((k) => (
          <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} variacao={k.v} nota={k.nota} serie={k.serie} />
        ))}
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Do acesso ao contato"
          descricao="Cada etapa é parte da anterior. Mostra onde as pessoas desistem."
          rodape={semImovel ? `Outras ${fmtInt(semImovel)} sessões chamaram a A3 sem ter aberto um imóvel (botão flutuante, rodapé, página inicial).` : undefined}
          tabela={<TabelaDados legenda="Funil de contato" colunas={[{ id: 'etapa', titulo: 'Etapa' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'total', titulo: 'Do total', numerica: true }, { id: 'anterior', titulo: 'Da etapa anterior', numerica: true }]} linhas={etapas.map((e, i) => ({ etapa: e.rotulo, sessoes: e.valor, total: { v: razao(e.valor, etapas[0]!.valor), t: fmtPct(razao(e.valor, etapas[0]!.valor)) }, anterior: i ? { v: razao(e.valor, etapas[i - 1]!.valor), t: fmtPct(razao(e.valor, etapas[i - 1]!.valor)) } : null }))} limite={5} />}
        >
          {etapas[0]!.valor > 0 ? <Funil etapas={etapas} formato={fmtInt} /> : nada}
        </Cartao>
        <Cartao
          titulo="Contatos por dia"
          descricao="Sessões que terminaram em contato."
          tabela={<TabelaDados legenda="Contatos por dia" limite={15} colunas={[{ id: 'dia', titulo: 'Dia' }, { id: 'contatos', titulo: 'Contatos', numerica: true }, { id: 'sessoes', titulo: 'Sessões', numerica: true }]} linhas={atual.map((p) => ({ dia: { v: p.dia, t: p.dia.split('-').reverse().join('/') }, contatos: p.conversoes, sessoes: p.sessoes }))} ordem={{ coluna: 'dia', decrescente: true }} />}
        >
          {periodo.dias < 2 ? <Vazio titulo="Escolha um período com mais de um dia" /> : (
            <>
              <GraficoLinha pontos={pontosDeLinha(atual, antes, (p) => p.conversoes)} formato={fmtInt} nomeSerie="Contatos" />
              {legendaComparacao}
            </>
          )}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Como as pessoas entram em contato"
          descricao="Cliques e envios no período."
          tabela={<TabelaDados legenda="Contatos por tipo" colunas={[{ id: 'tipo', titulo: 'Tipo' }, { id: 'total', titulo: 'Total', numerica: true }]} linhas={tipos.map((x) => ({ tipo: x.rotulo, total: x.valor }))} ordem={{ coluna: 'total', decrescente: true }} />}
        >
          {tipos.some((x) => x.valor > 0) ? <Barras itens={tipos.sort((a, b) => b.valor - a.valor).map((x) => ({ rotulo: x.rotulo, valor: x.valor }))} formato={fmtInt} /> : <Vazio titulo="Nenhum contato neste período" />}
        </Cartao>
        <Cartao
          titulo="Qual botão do WhatsApp mais funciona"
          descricao="Cliques no WhatsApp por lugar do site."
          tabela={<TabelaDados legenda="Cliques no WhatsApp por botão" colunas={[{ id: 'botao', titulo: 'Botão' }, { id: 'cliques', titulo: 'Cliques', numerica: true }]} linhas={Object.entries(botoes).map(([b, n]) => ({ botao: rotuloBotaoWhatsApp[b] ?? b, cliques: n }))} ordem={{ coluna: 'cliques', decrescente: true }} />}
        >
          {Object.keys(botoes).length ? <Barras itens={Object.entries(botoes).sort((a, b) => b[1] - a[1]).map(([b, n]) => ({ rotulo: rotuloBotaoWhatsApp[b] ?? b, valor: n, extras: [['Do total', fmtPct(razao(n, whatsapp))]] }))} formato={fmtInt} /> : <Vazio titulo="Nenhum clique no WhatsApp neste período" />}
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Formulários"
          descricao="Quantas pessoas começaram a preencher e quantas enviaram. A diferença é gente que desistiu no meio."
          tabela={undefined}
        >
          <TabelaDados
            legenda="Formulários de contato"
            colunas={[{ id: 'form', titulo: 'Formulário' }, { id: 'iniciados', titulo: 'Iniciados', numerica: true }, { id: 'enviados', titulo: 'Enviados', numerica: true }, { id: 'conclusao', titulo: 'Conclusão', numerica: true }, { id: 'erros', titulo: 'Erros', numerica: true }]}
            linhas={formularios.map((f) => ({ form: rotuloFormulario[f.chave] ?? f.chave, iniciados: f.iniciados, enviados: f.enviados, conclusao: { v: razao(f.enviados, f.iniciados), t: f.iniciados ? fmtPct(Math.min(1, razao(f.enviados, f.iniciados))) : '—' }, erros: f.erros }))}
            limite={5}
          />
        </Cartao>
        <Cartao
          titulo="Campos que mais dão erro"
          descricao="Onde as pessoas travam ao preencher. Só o nome do campo é guardado, nunca o que foi digitado."
          tabela={<TabelaDados legenda="Campos com erro" colunas={[{ id: 'campo', titulo: 'Formulário e campo' }, { id: 'erros', titulo: 'Erros', numerica: true }]} linhas={errosDeCampo.map((e) => { const [f = '', c = ''] = e.chave.split(':'); return { campo: `${rotuloFormulario[f] ?? f} · ${rotuloCampo[c] ?? c}`, erros: e.eventos } })} ordem={{ coluna: 'erros', decrescente: true }} />}
        >
          {errosDeCampo.length ? <Barras itens={errosDeCampo.slice(0, 8).map((e) => { const [f = '', c = ''] = e.chave.split(':'); return { rotulo: rotuloCampo[c] ?? c, sub: rotuloFormulario[f] ?? f, valor: e.eventos } })} formato={fmtInt} cor="var(--g-2)" /> : <Vazio titulo="Nenhum erro de preenchimento" />}
        </Cartao>
      </div>

      <div className={s.grade} data-colunas="3">
        <Cartao
          titulo="Taxa de contato por canal"
          tabela={<TabelaDados legenda="Taxa de contato por canal" colunas={[{ id: 'canal', titulo: 'Canal' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={canais.map((c) => ({ canal: rotuloCanal[c.chave] ?? c.chave, sessoes: c.sessoes, taxa: { v: razao(c.conversoes, c.sessoes), t: fmtPct(razao(c.conversoes, c.sessoes)) } }))} ordem={{ coluna: 'taxa', decrescente: true }} />}
        >
          {canais.length ? <Barras itens={[...canais].sort((a, b) => razao(b.conversoes, b.sessoes) - razao(a.conversoes, a.sessoes)).map((c) => ({ rotulo: rotuloCanal[c.chave] ?? c.chave, valor: razao(c.conversoes, c.sessoes), texto: fmtPct(razao(c.conversoes, c.sessoes)), sub: `${fmtInt(c.sessoes)} sessões`, esmaecida: c.sessoes < 20 }))} formato={(n) => fmtPct(n)} /> : nada}
        </Cartao>
        <Cartao
          titulo="Taxa de contato por aparelho"
          tabela={<TabelaDados legenda="Taxa de contato por aparelho" colunas={[{ id: 'a', titulo: 'Aparelho' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={aparelhos.map((c) => ({ a: rotuloAparelho[c.chave] ?? c.chave, sessoes: c.sessoes, taxa: { v: razao(c.conversoes, c.sessoes), t: fmtPct(razao(c.conversoes, c.sessoes)) } }))} ordem={{ coluna: 'taxa', decrescente: true }} />}
        >
          {aparelhos.length ? <Barras itens={[...aparelhos].sort((a, b) => razao(b.conversoes, b.sessoes) - razao(a.conversoes, a.sessoes)).map((c) => ({ rotulo: rotuloAparelho[c.chave] ?? c.chave, valor: razao(c.conversoes, c.sessoes), texto: fmtPct(razao(c.conversoes, c.sessoes)), sub: `${fmtInt(c.sessoes)} sessões`, esmaecida: c.sessoes < 20 }))} formato={(n) => fmtPct(n)} /> : nada}
        </Cartao>
        <Cartao
          titulo="Taxa de contato por faixa de preço"
          descricao="Sessões em imóveis de cada faixa que viraram contato."
          tabela={<TabelaDados legenda="Taxa de contato por faixa de preço" colunas={[{ id: 'f', titulo: 'Faixa' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={porFaixa.map((c) => ({ f: c.chave, sessoes: c.sessoes, taxa: { v: razao(c.conversoes, c.sessoes), t: fmtPct(razao(c.conversoes, c.sessoes)) } }))} />}
        >
          {porFaixa.some((c) => c.sessoes > 0) ? <Barras itens={porFaixa.map((c) => ({ rotulo: c.chave, valor: razao(c.conversoes, c.sessoes), texto: fmtPct(razao(c.conversoes, c.sessoes)), sub: `${fmtInt(c.sessoes)} sessões`, esmaecida: c.sessoes < 20 }))} formato={(n) => fmtPct(n)} /> : nada}
        </Cartao>
      </div>
    </>
  )
}
