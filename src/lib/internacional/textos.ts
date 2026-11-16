// Dicionário e conteúdo de cada idioma. Os arquivos são pequenos e só rodam no servidor; o navegador recebe só o HTML
// e, nos componentes interativos, os poucos textos que eles usam.
import 'server-only'
import type { Dicionario } from './dicionario'
import type { ConteudoIdioma } from './conteudo/tipos'
import type { Idioma } from './idiomas'
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

const DICIONARIOS: Record<Idioma, Dicionario> = { en, it, es, fr, de }
const CONTEUDOS: Record<Idioma, ConteudoIdioma> = { en: conteudoEn, it: conteudoIt, es: conteudoEs, fr: conteudoFr, de: conteudoDe }

export const dicionario = (idioma: Idioma) => DICIONARIOS[idioma]
export const conteudo = (idioma: Idioma) => CONTEUDOS[idioma]
