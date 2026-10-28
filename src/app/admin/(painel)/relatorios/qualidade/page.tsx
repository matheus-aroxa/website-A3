import Link from 'next/link'
import { Cartao } from '@/components/admin/relatorios/Cartao'
import { Colunas, Medidor } from '@/components/admin/relatorios/Graficos'
import { GradeKpi, Kpi } from '@/components/admin/relatorios/Indicadores'
import { PaginaDeRelatorio } from '@/components/admin/relatorios/Pagina'
import s from '@/components/admin/relatorios/Relatorios.module.css'
import { TabelaDados } from '@/components/admin/relatorios/Tabela'
import { distribuicoesDoCatalogo, qualidadeDoCadastro } from '@/lib/relatorios/catalogo'
import { fmtInt, fmtPct, razao } from '@/lib/relatorios/formato'

export default function PaginaQualidade({ searchParams }: PageProps<'/admin/relatorios/qualidade'>) {
  return (
    <PaginaDeRelatorio parametros={searchParams} usaPeriodo={false} arquivo="qualidade-do-cadastro">
      {async () => <Qualidade />}
    </PaginaDeRelatorio>
  )
}

async function Qualidade() {
  const [{ ativos, itens }, d] = await Promise.all([qualidadeDoCadastro(30), distribuicoesDoCatalogo()])
  const ordenados = [...itens].sort((a, b) => b.falhas - a.falhas)
  const completude = itens.length ? 1 - razao(itens.reduce((a, i) => a + i.falhas, 0), ativos * itens.length) : 1
  const semProblema = itens.filter((i) => i.falhas === 0).length
  // A barra é a parte dos imóveis com o problema: quanto maior e mais avermelhada, mais urgente.
  const nivel = (parte: number) => (parte <= 0.1 ? 'bom' : parte <= 0.4 ? 'atencao' : 'critico')

  return (
    <>
      <GradeKpi
        titulo="Indicadores de qualidade"
        itens={[
          { rotulo: 'Completude do cadastro', valor: fmtPct(completude, 0) },
          { rotulo: 'Verificações sem problema', valor: `${semProblema} de ${itens.length}` },
          { rotulo: 'Imóveis ativos', valor: fmtInt(ativos) },
        ]}
      >
        <Kpi rotulo="Completude do cadastro" valor={fmtPct(completude, 0)} nota="Média das verificações abaixo: quanto dos dados esperados está preenchido" />
        <Kpi rotulo="Verificações sem problema" valor={`${semProblema} de ${itens.length}`} />
        <Kpi rotulo="Imóveis ativos" valor={fmtInt(ativos)} />
      </GradeKpi>

      <Cartao
        titulo="O que corrigir no cadastro"
        descricao="Do problema que atinge mais imóveis ao que atinge menos. A barra mostra a parte dos imóveis com o problema; abra cada item para ver quais são e corrigir."
        tabela={<TabelaDados legenda="Verificações do cadastro" colunas={[{ id: 'v', titulo: 'Verificação' }, { id: 'falhas', titulo: 'Imóveis com o problema', numerica: true }, { id: 'ok', titulo: 'Em ordem', numerica: true }]} linhas={ordenados.map((i) => ({ v: i.titulo, falhas: i.falhas, ok: { v: 1 - razao(i.falhas, ativos), t: fmtPct(1 - razao(i.falhas, ativos), 0) } }))} ordem={{ coluna: 'falhas', decrescente: true }} limite={12} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {ordenados.map((i) => {
            const parte = razao(i.falhas, ativos)
            return (
              <div key={i.chave} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Medidor rotulo={i.titulo} fracao={parte} nivel={nivel(parte)} texto={i.falhas ? `${fmtInt(i.falhas)} de ${fmtInt(ativos)} imóveis (${fmtPct(razao(i.falhas, ativos), 0)})` : 'Tudo em ordem'} />
                <p className={s.rodapeCartao}>{i.efeito}</p>
                {i.falhas > 0 && (
                  <details className={s.detalhes}>
                    <summary>Ver {i.exemplos.length < i.falhas ? `os ${i.exemplos.length} primeiros` : 'os imóveis'}</summary>
                    <ul>
                      {i.exemplos.map((e) => (
                        <li key={e.id}>
                          <Link href={`/admin/imoveis/${e.id}`}>
                            <strong>{e.nome}</strong>
                            <small>{e.local}</small>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      </Cartao>

      <div className={s.grade}>
        <Cartao titulo="Atualização do cadastro" descricao="Há quanto tempo cada imóvel foi atualizado. Preço e disponibilidade envelhecem rápido." tabela={<TabelaDados legenda="Imóveis por última atualização" colunas={[{ id: 'a', titulo: 'Atualizado há' }, { id: 'n', titulo: 'Imóveis', numerica: true }]} linhas={d.atualizacao.map((x) => ({ a: x.chave, n: x.valor }))} />}>
          <Colunas itens={d.atualizacao.map((x) => ({ rotulo: x.chave.replace('Mais de 1 ano', '> 1 ano').replace(' dias', 'd').replace('Até ', '≤ '), nome: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
        <Cartao titulo="Fotos por imóvel" descricao="Anúncios com mais fotos recebem mais contatos." tabela={<TabelaDados legenda="Imóveis por quantidade de fotos" colunas={[{ id: 'a', titulo: 'Fotos' }, { id: 'n', titulo: 'Imóveis', numerica: true }]} linhas={d.fotos.map((x) => ({ a: x.chave, n: x.valor }))} />}>
          <Colunas itens={d.fotos.map((x) => ({ rotulo: x.chave.replace(' fotos', '').replace('Sem', '0'), nome: x.chave, valor: x.valor }))} formato={fmtInt} />
        </Cartao>
      </div>
    </>
  )
}
