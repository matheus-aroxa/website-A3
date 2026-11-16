import { DADOS_IDIOMA, IDIOMAS_AUTOMATICOS, IDIOMAS_REVISADOS, tradutorAtivo, type Idioma } from '@/lib/internacional/idiomas'
import s from './Internacional.module.css'

/** Endereço desta página em cada idioma ("pt" = site em português). Sem a versão, o link leva à página inicial do idioma. */
export type Versoes = Partial<Record<Idioma | 'pt', string>>

interface Opcao {
  codigo: string
  nome: string
  href: string
  lang: string
}

/**
 * Lista de idiomas (sem JavaScript: <details>). Cada link leva à mesma página no outro idioma. Os idiomas de tradução
 * automática vêm num grupo à parte, só com o tradutor ligado.
 */
export function SeletorIdioma({
  idioma,
  versoes,
  rotulo,
  portugues,
  rotuloAutomaticos,
}: {
  /** Idioma da página ("pt" no site em português). */
  idioma: Idioma | 'pt'
  versoes: Versoes
  rotulo: string
  portugues: string
  /** Título do grupo dos idiomas automáticos ("Tradução automática"). */
  rotuloAutomaticos: string
}) {
  const nomeAtual = idioma === 'pt' ? portugues : DADOS_IDIOMA[idioma].nome
  const opcao = (i: Idioma): Opcao => ({ codigo: i, nome: DADOS_IDIOMA[i].nome, href: versoes[i] ?? `/${i}`, lang: DADOS_IDIOMA[i].lang })
  const principais = [...IDIOMAS_REVISADOS.map(opcao), { codigo: 'pt', nome: portugues, href: versoes.pt ?? '/', lang: 'pt-BR' }]
  const automaticos = tradutorAtivo() ? IDIOMAS_AUTOMATICOS.map(opcao) : []

  const lista = (opcoes: Opcao[], nofollow = false) => (
    <ul>
      {opcoes.map((o) => (
        <li key={o.codigo}>
          {/* <a> e não <Link>: cada idioma tem o próprio layout raiz (<html lang>), a troca recarrega a página. */}
          <a
            href={o.href}
            hrefLang={o.lang}
            lang={o.lang}
            rel={nofollow ? 'nofollow' : undefined}
            aria-current={o.codigo === idioma || undefined}
          >
            {o.nome}
            <small>{o.codigo}</small>
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <details className={s.idioma}>
      <summary aria-label={`${rotulo}: ${nomeAtual}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        {idioma}
      </summary>
      <div className={s.idiomaLista}>
        {lista(principais)}
        {automaticos.length > 0 && (
          <>
            <p className={s.idiomaGrupo}>{rotuloAutomaticos}</p>
            {/* Fora do Google: o robô não precisa seguir para as páginas de tradução automática. */}
            {lista(automaticos, true)}
          </>
        )}
      </div>
    </details>
  )
}
