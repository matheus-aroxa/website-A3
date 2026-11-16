import type { ReactNode } from 'react'
import pt from '@/components/layout/PaginaTexto.module.css'
import type { Artigo as DadosArtigo, Bloco } from '@/lib/internacional/conteudo/tipos'
import s from './Internacional.module.css'

function Destaque({ destaque, texto }: { destaque?: string; texto: string }) {
  return (
    <>
      {destaque && <strong>{destaque} </strong>}
      {texto}
    </>
  )
}

function BlocoArtigo({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return <p>{bloco.texto}</p>
    case 'lista':
      return (
        <ul>
          {bloco.itens.map((item) => (
            <li key={item.texto}>
              <Destaque {...item} />
            </li>
          ))}
        </ul>
      )
    case 'passos':
      return (
        <ol>
          {bloco.itens.map((item) => (
            <li key={item.destaque}>
              <Destaque {...item} />
            </li>
          ))}
        </ol>
      )
    case 'tabela':
      return (
        <>
          <div className={s.tabela}>
            <table>
              <thead>
                <tr>
                  {bloco.colunas.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloco.linhas.map((linha) => (
                  <tr key={linha[0]}>
                    {linha.map((celula, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          {celula}
                        </th>
                      ) : (
                        <td key={i}>{celula}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bloco.nota && <p>{bloco.nota}</p>}
        </>
      )
    case 'perguntas':
      return (
        <div className={s.perguntas}>
          {bloco.itens.map((item) => (
            <div key={item.pergunta}>
              <h3>{item.pergunta}</h3>
              <p>{item.resposta}</p>
            </div>
          ))}
        </div>
      )
  }
}

/**
 * Guia de compra e página da região: texto longo, só HTML. Mesmo desenho da página de texto do site em português
 * (política de privacidade, components/layout/PaginaTexto.module.css); tabela, perguntas e chamada final são daqui.
 */
export function Artigo({ artigo, contato, migalhas }: { artigo: DadosArtigo; contato: string; migalhas: ReactNode }) {
  return (
    <article className={pt.conteudo}>
      {migalhas}
      <span className="sobretitulo">{artigo.sobretitulo}</span>
      <h1>{artigo.titulo}</h1>
      <p className={s.artigoIntro}>{artigo.intro}</p>
      {artigo.secoes.map((secao) => (
        <section key={secao.titulo} className={s.artigoSecao}>
          <h2>{secao.titulo}</h2>
          {secao.blocos.map((bloco, i) => (
            <BlocoArtigo key={i} bloco={bloco} />
          ))}
        </section>
      ))}
      {artigo.aviso && <p className={pt.aviso}>{artigo.aviso}</p>}
      {artigo.chamada && (
        <aside className={s.chamada}>
          <h2>{artigo.chamada.titulo}</h2>
          <p>{artigo.chamada.texto}</p>
          <a href={contato} className="btn btn-sol btn-g btn-quadrado">
            {artigo.chamada.botao}
          </a>
        </aside>
      )}
    </article>
  )
}
