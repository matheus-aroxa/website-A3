// Formato dos textos longos da área internacional (guia de compra e região). Base: o documento "Área internacional —
// rascunhos dos textos", revisado pela A3. Cada idioma tem um arquivo com o mesmo formato.

export type Bloco =
  | { tipo: 'paragrafo'; texto: string }
  /** Lista com um termo em destaque no começo de cada item (opcional). */
  | { tipo: 'lista'; itens: { destaque?: string; texto: string }[] }
  | { tipo: 'passos'; itens: { destaque: string; texto: string }[] }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][]; nota?: string }
  | { tipo: 'perguntas'; itens: { pergunta: string; resposta: string }[] }

export interface Artigo {
  tituloSeo: string
  descricaoSeo: string
  sobretitulo: string
  titulo: string
  intro: string
  secoes: { titulo: string; blocos: Bloco[] }[]
  /** Aviso no fim (o guia é informativo e não substitui um advogado). */
  aviso?: string
  /** Chamada para o contato no fim do artigo (a política de privacidade não tem). */
  chamada?: { titulo: string; texto: string; botao: string }
}

export interface ConteudoIdioma {
  guia: Artigo
  regiao: Artigo
  /** Tradução da política de privacidade (app/(site)/politica-de-privacidade): o texto em português é o que vale. */
  privacidade: Artigo
}
