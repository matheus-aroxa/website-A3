// Dicionário e conteúdo de cada idioma. Os arquivos são pequenos e só rodam no servidor; o navegador recebe só o HTML
// e, nos componentes interativos, os poucos textos que eles usam. Nos idiomas automáticos, os textos são os do inglês
// traduzidos na hora (automatico.ts), por isso as funções são assíncronas.
import 'server-only'
import type { Dicionario } from './dicionario'
import type { ConteudoIdioma } from './conteudo/tipos'
import { artigoAutomatico, dicionarioAutomatico } from './automatico'
import type { Artigo } from './conteudo/tipos'
import { ehRevisado, type Idioma, type IdiomaRevisado } from './idiomas'
import en from './dicionarios/en'
import it from './dicionarios/it'
import es from './dicionarios/es'
import fr from './dicionarios/fr'
import de from './dicionarios/de'
import conteudoEn from './conteudo/en'
import conteudoIt from './conteudo/it'
import conteudoEs from './conteudo/es'
import conteudoFr from './conteudo/fr'
import conteudoDe from './conteudo/de'

const DICIONARIOS: Record<IdiomaRevisado, Dicionario> = { en, it, es, fr, de }
const CONTEUDOS: Record<IdiomaRevisado, ConteudoIdioma> = { en: conteudoEn, it: conteudoIt, es: conteudoEs, fr: conteudoFr, de: conteudoDe }

export async function dicionario(idioma: Idioma): Promise<Dicionario> {
  return ehRevisado(idioma) ? DICIONARIOS[idioma] : dicionarioAutomatico(idioma)
}

/** Guia de compra, região ou política de privacidade no idioma. */
export async function artigo(idioma: Idioma, secao: keyof ConteudoIdioma): Promise<Artigo> {
  return ehRevisado(idioma) ? CONTEUDOS[idioma][secao] : artigoAutomatico(idioma, secao)
}
