import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import { COLUNAS_DE_AUDIENCIA, linhaDeAudiencia } from '@/components/admin/relatorios/blocos'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { porDimensao, type LinhaDimensao } from '@/lib/relatorios/audiencia'
import { fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'
import type { ContextoDoRelatorio } from '@/lib/relatorios/pagina'
import { canalDaOrigem, rotuloCanal, rotuloOrigem } from '@/lib/relatorios/rotulos'

export default function PaginaOrigens({ searchParams }: PageProps<'/admin/relatorios/origens'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams}>
      {(ctx) => <Origens ctx={ctx} />}
    </PaginaDeRelatorio>
  )
}

const colunas = (titulo: string) => COLUNAS_DE_AUDIENCIA.map((c) => (c.id === 'chave' ? { ...c, titulo } : c))
const conversao = (l: LinhaDimensao) => razao(l.conversoes, l.sessoes)

async function Origens({ ctx }: { ctx: ContextoDoRelatorio }) {
  const { periodo } = ctx
  const [canais, origens, campanhas] = await Promise.all([
    porDimensao(periodo, 'canal'),
    porDimensao(periodo, 'origem', { limite: 40 }),
    porDimensao(periodo, 'campanha', { limite: 40 }),
  ])
  const total = canais.reduce((a, c) => a + c.sessoes, 0)
  const diretas = canais.find((c) => c.chave === 'direto')?.sessoes ?? 0
  const melhor = [...canais].filter((c) => c.sessoes >= 20).sort((a, b) => conversao(b) - conversao(a))[0]
  const sitesDeFora = origens.filter((o) => canalDaOrigem(o.chave) === 'sites')
  const nada = <Vazio titulo="Sem sessões neste período" />

  return (
    <>
      <GradeKpi>
        <Kpi rotulo="Sessões" valor={fmtInt(total)} />
        <Kpi rotulo="Acessos diretos" valor={fmtPct(razao(diretas, total))} nota="Digitaram o endereço, usaram um favorito ou vieram de um app que não informa a origem" />
        <Kpi rotulo="Canal que mais converte" valor={melhor ? fmtPct(conversao(melhor)) : '—'} nota={melhor ? `${rotuloCanal[melhor.chave] ?? melhor.chave} (a partir de 20 sessões)` : 'Poucas sessões para comparar'} />
        <Kpi rotulo="Campanhas com UTM" valor={fmtInt(campanhas.length)} nota="Links com utm_campaign" />
      </GradeKpi>

      <div className={s.grade}>
        <Cartao
          titulo="Canais"
          descricao="Grupos de origem das sessões."
          tabela={<TabelaDados legenda="Canais" colunas={colunas('Canal')} linhas={canais.map((c) => linhaDeAudiencia(rotuloCanal[c.chave] ?? c.chave, c))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {canais.length ? <Barras itens={canais.map((c) => ({ rotulo: rotuloCanal[c.chave] ?? c.chave, valor: c.sessoes, extras: [['Participação', fmtPct(razao(c.sessoes, total))], ['Contato', fmtPct(conversao(c))]] }))} formato={fmtInt} /> : nada}
        </Cartao>
        <Cartao
          titulo="Quais canais viram contato"
          descricao="Parte das sessões de cada canal que terminou em WhatsApp ou formulário enviado."
          tabela={<TabelaDados legenda="Taxa de contato por canal" colunas={[{ id: 'canal', titulo: 'Canal' }, { id: 'sessoes', titulo: 'Sessões', numerica: true }, { id: 'contatos', titulo: 'Com contato', numerica: true }, { id: 'taxa', titulo: 'Taxa', numerica: true }]} linhas={canais.map((c) => ({ canal: rotuloCanal[c.chave] ?? c.chave, sessoes: c.sessoes, contatos: c.conversoes, taxa: { v: conversao(c), t: fmtPct(conversao(c)) } }))} ordem={{ coluna: 'taxa', decrescente: true }} />}
        >
          {canais.length ? (
            <Barras
              itens={[...canais].sort((a, b) => conversao(b) - conversao(a)).map((c) => ({ rotulo: rotuloCanal[c.chave] ?? c.chave, valor: conversao(c), texto: fmtPct(conversao(c)), sub: `${fmtInt(c.conversoes)} de ${fmtInt(c.sessoes)} sessões`, esmaecida: c.sessoes < 20 }))}
              formato={(n) => fmtPct(n)}
            />
          ) : nada}
          {canais.some((c) => c.sessoes < 20) && <p className={s.rodapeCartao} style={{ marginTop: 10 }}>Barras cinza: menos de 20 sessões, pouca base para comparar.</p>}
        </Cartao>
      </div>

      <Cartao
        titulo="Origens"
        descricao="De qual site ou aplicativo cada sessão veio (Google, Instagram, WhatsApp...)."
        tabela={<TabelaDados legenda="Origens" limite={15} colunas={[{ id: 'chave', titulo: 'Origem' }, { id: 'canal', titulo: 'Canal' }, ...COLUNAS_DE_AUDIENCIA.slice(1)]} linhas={origens.map((o) => ({ ...linhaDeAudiencia(rotuloOrigem(o.chave), o), canal: rotuloCanal[canalDaOrigem(o.chave)] ?? canalDaOrigem(o.chave) }))} ordem={{ coluna: 'sessoes', decrescente: true }} buscar />}
      >
        {origens.length ? <Barras itens={origens.slice(0, 12).map((o) => ({ rotulo: rotuloOrigem(o.chave), sub: rotuloCanal[canalDaOrigem(o.chave)], valor: o.sessoes, extras: [['Contato', fmtPct(conversao(o))]] }))} formato={fmtInt} /> : <Vazio titulo="Nenhuma origem identificada" texto="Quem digita o endereço ou usa um favorito aparece como acesso direto." />}
      </Cartao>

      <div className={s.grade}>
        <Cartao
          titulo="Campanhas"
          descricao="Links marcados com utm_campaign (anúncios, posts, mensagens)."
          rodape="Para medir um anúncio ou post, use o endereço com parâmetros, por exemplo: /imoveis/lancamentos?utm_source=instagram&utm_medium=cpc&utm_campaign=lancamentos-outubro"
          tabela={<TabelaDados legenda="Campanhas" colunas={colunas('Campanha')} linhas={campanhas.map((c) => linhaDeAudiencia(c.chave, c))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {campanhas.length ? <Barras itens={campanhas.slice(0, 10).map((c) => ({ rotulo: c.chave, valor: c.sessoes, extras: [['Contato', fmtPct(conversao(c))]] }))} formato={fmtInt} /> : <Vazio titulo="Nenhuma campanha com UTM no período" />}
        </Cartao>
        <Cartao
          titulo="Outros sites que enviam visitas"
          descricao="Sites de terceiros (blogs, portais, parceiros) com links para o seu."
          tabela={<TabelaDados legenda="Sites de referência" colunas={colunas('Site')} linhas={sitesDeFora.map((c) => linhaDeAudiencia(rotuloOrigem(c.chave), c))} ordem={{ coluna: 'sessoes', decrescente: true }} />}
        >
          {sitesDeFora.length ? <Barras itens={sitesDeFora.slice(0, 10).map((c) => ({ rotulo: rotuloOrigem(c.chave), valor: c.sessoes }))} formato={fmtInt} /> : <Vazio titulo="Nenhum site de terceiros no período" />}
        </Cartao>
      </div>
    </>
  )
}
