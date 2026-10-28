import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Barras, BarraEmpilhada, Colunas, Vazio } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { distribuicoesDoCatalogo, resumoDoCatalogo, type Contagem } from '@/lib/relatorios/catalogo'
import { fmtInt, fmtMoeda, fmtMoedaCompacta, fmtPct, razao } from '@/lib/relatorios/formato'
import { rotuloSituacao, rotuloTipo } from '@/lib/imoveis/formato'
import type { Situacao, TipoImovel } from '@/lib/imoveis/tipos'

export default function PaginaCatalogo({ searchParams }: PageProps<'/admin/relatorios/catalogo'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} usaPeriodo={false} arquivo="catalogo">
      {async () => <Catalogo />}
    </PaginaDeRelatorio>
  )
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mesCurto = (aaaamm: string) => `${MESES[Number(aaaamm.slice(5)) - 1]}/${aaaamm.slice(2, 4)}`
const tabelaDe = (legenda: string, titulo: string, itens: Contagem[], total?: number) => (
  <TabelaDados
    legenda={legenda}
    limite={15}
    colunas={[{ id: 'item', titulo }, { id: 'imoveis', titulo: 'Imóveis', numerica: true }, ...(total ? [{ id: 'pct', titulo: 'Do total', numerica: true }] : [])]}
    linhas={itens.map((i) => ({ item: i.chave, imoveis: i.valor, ...(total ? { pct: { v: razao(i.valor, total), t: fmtPct(razao(i.valor, total)) } } : {}) }))}
  />
)

async function Catalogo() {
  const [r, d] = await Promise.all([resumoDoCatalogo(), distribuicoesDoCatalogo()])
  const ativos = r.imoveis.ativos
  const kpis = [
    { rotulo: 'Imóveis ativos', valor: fmtInt(ativos), nota: r.imoveis.inativos ? `${fmtInt(r.imoveis.inativos)} desativados` : 'Nenhum desativado' },
    { rotulo: 'À venda', valor: fmtInt(r.imoveis.venda), nota: `${fmtInt(r.imoveis.lancamentos)} em lançamento` },
    { rotulo: 'Para alugar', valor: fmtInt(r.imoveis.aluguel) },
    { rotulo: 'Minha Casa Minha Vida', valor: fmtInt(r.imoveis.mcmv), nota: `${fmtPct(razao(r.imoveis.mcmv, ativos), 0)} dos imóveis` },
    { rotulo: 'Construtoras', valor: fmtInt(r.construtoras.comImoveis), nota: `${fmtInt(r.construtoras.total)} cadastradas${r.construtoras.semImoveis ? ` · ${r.construtoras.semImoveis} sem imóvel` : ''}` },
    { rotulo: 'Cidades', valor: fmtInt(r.local.cidades), nota: `${fmtInt(r.local.bairros)} bairros` },
    { rotulo: 'Fotos', valor: fmtInt(r.midia.fotos), nota: `${(r.midia.fotos / Math.max(1, ativos)).toFixed(1).replace('.', ',')} por imóvel` },
    { rotulo: 'Plantas', valor: fmtInt(r.midia.plantas), nota: `em ${fmtInt(r.midia.imoveisComPlanta)} imóveis` },
    { rotulo: 'Preço mediano (venda)', valor: fmtMoedaCompacta(r.precos.medianoVenda), nota: `média ${fmtMoeda(r.precos.medioVenda)}` },
    { rotulo: 'Aluguel médio', valor: r.precos.medioAluguel ? fmtMoeda(r.precos.medioAluguel) : '—' },
    { rotulo: 'Na vitrine da home', valor: fmtInt(r.imoveis.naVitrine) },
    { rotulo: 'Administradores', valor: fmtInt(r.administradores), nota: 'Com acesso ao painel' },
  ]
  const tipo = d.tipo.map((x) => ({ ...x, chave: rotuloTipo[x.chave as TipoImovel] ?? x.chave }))
  const CORES_TIPO: Record<string, string> = { apartamento: 'var(--g-1)', 'casa-condominio': 'var(--g-2)', terreno: 'var(--g-3)' }
  const CORES_SITUACAO: Record<string, string> = { 'breve-lancamento': 'var(--g-1)', lancamento: 'var(--g-2)', 'em-construcao': 'var(--g-3)', pronto: 'var(--g-4)' }
  const totalVenda = d.situacao.reduce((a, x) => a + x.valor, 0)

  return (
    <>
      <GradeKpi titulo="Indicadores do catálogo" itens={kpis.map((k) => ({ rotulo: k.rotulo, valor: k.valor }))}>
        {kpis.map((k) => <Kpi key={k.rotulo} rotulo={k.rotulo} valor={k.valor} nota={k.nota} />)}
      </GradeKpi>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Tipo de imóvel" tabela={tabelaDe('Imóveis por tipo', 'Tipo', tipo, ativos)}>
          <BarraEmpilhada segmentos={d.tipo.map((x) => ({ rotulo: rotuloTipo[x.chave as TipoImovel] ?? x.chave, valor: x.valor, cor: CORES_TIPO[x.chave] ?? 'var(--g-anterior)' }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Venda e aluguel" tabela={tabelaDe('Imóveis por finalidade', 'Finalidade', d.finalidade.map((x) => ({ ...x, chave: x.chave === 'venda' ? 'À venda' : 'Para alugar' })), ativos)}>
          <BarraEmpilhada segmentos={d.finalidade.map((x) => ({ rotulo: x.chave === 'venda' ? 'À venda' : 'Para alugar', valor: x.valor, cor: x.chave === 'venda' ? 'var(--g-1)' : 'var(--g-2)' }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Fase da obra" descricao="Imóveis à venda." tabela={tabelaDe('Imóveis por fase da obra', 'Fase', d.situacao.map((x) => ({ ...x, chave: rotuloSituacao[x.chave as Situacao] ?? x.chave })), totalVenda)}>
          <BarraEmpilhada segmentos={d.situacao.map((x) => ({ rotulo: rotuloSituacao[x.chave as Situacao] ?? x.chave, valor: x.valor, cor: CORES_SITUACAO[x.chave] ?? 'var(--g-anterior)', escuro: x.chave === 'pronto' }))} formato={fmtInt} />
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao
          titulo="Imóveis por cidade"
          descricao="Com o preço mediano de venda de cada uma na dica."
          tabela={
            <TabelaDados
              legenda="Imóveis por cidade"
              limite={15}
              colunas={[{ id: 'cidade', titulo: 'Cidade' }, { id: 'imoveis', titulo: 'Imóveis', numerica: true }, { id: 'mediano', titulo: 'Preço mediano (venda)', numerica: true }]}
              linhas={d.cidade.map((c) => ({ cidade: c.chave, imoveis: c.valor, mediano: c.precoMediano ? { v: c.precoMediano, t: fmtMoeda(c.precoMediano) } : null }))}
            />
          }
        >
          <Barras itens={d.cidade.slice(0, 12).map((c) => ({ rotulo: c.chave, valor: c.valor, extras: c.precoMediano ? [['Preço mediano', fmtMoeda(c.precoMediano)]] : [] }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Imóveis por bairro" descricao="Os 20 bairros com mais imóveis." tabela={tabelaDe('Imóveis por bairro', 'Bairro', d.bairro.map((b) => ({ chave: `${b.chave} (${b.cidade})`, valor: b.valor })))}>
          <Barras itens={d.bairro.slice(0, 12).map((b) => ({ rotulo: b.chave, sub: b.cidade, valor: b.valor }))} formato={fmtInt} />
        </Cartao>
      </div>

      <div className={s.grade}>
        <Cartao titulo="Imóveis por construtora" descricao="As 15 construtoras com mais imóveis; “Não informado” fica de fora do ranking e aparece na tabela." tabela={tabelaDe('Imóveis por construtora', 'Construtora', d.construtora, ativos)}>
          <Barras itens={d.construtora.filter((c) => c.chave !== 'Não informado').slice(0, 15).map((c) => ({ rotulo: c.chave, valor: c.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Preço por m²" descricao="Mediana do preço por m² de venda em cada cidade (cidades com 3 imóveis ou mais, sem terrenos)." tabela={<TabelaDados legenda="Preço por m² por cidade" colunas={[{ id: 'c', titulo: 'Cidade' }, { id: 'v', titulo: 'R$ por m²', numerica: true }, { id: 'n', titulo: 'Imóveis', numerica: true }]} linhas={d.precoPorM2PorCidade.map((x) => ({ c: x.chave, v: { v: x.valor, t: fmtMoeda(x.valor) }, n: x.imoveis }))} ordem={{ coluna: 'v', decrescente: true }} />}>
          {d.precoPorM2PorCidade.length ? <Barras itens={d.precoPorM2PorCidade.slice(0, 12).map((x) => ({ rotulo: x.chave, valor: x.valor, texto: fmtMoeda(x.valor), sub: `${x.imoveis} imóveis` }))} formato={fmtMoeda} /> : <Vazio titulo="Poucos imóveis para calcular" />}
        </Cartao>
      </div>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Faixa de preço" descricao="Imóveis à venda." tabela={tabelaDe('Imóveis por faixa de preço', 'Faixa', d.faixaDePreco)}>
          <Colunas itens={d.faixaDePreco.map((x) => ({ rotulo: x.chave.replace('R$ ', '').replace(' mil', 'k').replace('Até ', '≤ ').replace('Acima de ', '> '), nome: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Quartos" descricao="Imóveis com opção de cada quantidade (um imóvel de 2 e 3 quartos conta nos dois)." tabela={tabelaDe('Imóveis por quartos', 'Quartos', d.quartos.map((x) => ({ ...x, chave: x.chave === '4' ? '4 ou mais' : `${x.chave}` })))}>
          <Colunas itens={d.quartos.map((x) => ({ rotulo: x.chave === '4' ? '4+' : x.chave, nome: `${x.chave === '4' ? '4 ou mais' : x.chave} quarto${x.chave === '1' ? '' : 's'}`, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Entrega" descricao="Quando os imóveis à venda ficam prontos." tabela={tabelaDe('Imóveis por ano de entrega', 'Entrega', d.entrega)}>
          <Colunas itens={d.entrega.map((x) => ({ rotulo: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
      </div>

      <div className={s.grade} data-colunas="3">
        <Cartao titulo="Atualização do cadastro" descricao="Há quanto tempo cada imóvel foi atualizado." tabela={tabelaDe('Imóveis por última atualização', 'Atualizado há', d.atualizacao, ativos)}>
          <Colunas itens={d.atualizacao.map((x) => ({ rotulo: x.chave.replace('Mais de 1 ano', '> 1 ano').replace(' dias', 'd').replace('Até ', '≤ '), nome: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Fotos por imóvel" tabela={tabelaDe('Imóveis por quantidade de fotos', 'Fotos', d.fotos, ativos)}>
          <Colunas itens={d.fotos.map((x) => ({ rotulo: x.chave.replace(' fotos', '').replace('Sem', '0'), nome: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Cadastros por mês" descricao="Imóveis ativos pela data de publicação." tabela={tabelaDe('Imóveis por mês de publicação', 'Mês', d.cadastrosPorMes.map((x) => ({ ...x, chave: mesCurto(x.chave) })))}>
          <Colunas itens={d.cadastrosPorMes.map((x) => ({ rotulo: x.chave.endsWith('-01') || x.chave.endsWith('-07') ? mesCurto(x.chave) : '', nome: mesCurto(x.chave), valor: x.valor }))} formato={fmtInt} valores={false} />
        </Cartao>
      </div>
    </>
  )
}
