// Modelo de dados dos imóveis. É o contrato entre o site e o CRM: o adaptador do CRM
// (src/lib/crm) deve converter a resposta da API para estes tipos.

export type Finalidade = 'venda' | 'aluguel'
export type Situacao = 'breve-lancamento' | 'lancamento' | 'em-construcao' | 'pronto'
export type TipoImovel = 'apartamento' | 'casa-condominio' | 'terreno'

export interface Foto {
  src: string
  width: number
  height: number
  blurDataURL?: string
  alt: string
  legenda?: string
}

export interface Faixa {
  min: number
  max: number
}

export interface Localizacao {
  bairro: string
  bairroSlug: string
  cidade: string
  cidadeSlug: string
  uf: string
  /** Rua e número. Quando ausente, o site mostra só bairro e cidade. */
  logradouro?: string
  geo?: { lat: number; lng: number }
}

export interface Planta {
  titulo: string
  descricao: string
  area: number
  foto: Foto
}

export interface Imovel {
  id: string
  codigo: string
  slug: string
  nome: string
  tipo: TipoImovel
  finalidade: Finalidade
  situacao: Situacao
  local: Localizacao
  /** Em reais. Para aluguel, valor mensal. */
  preco: number
  /** Área privativa em m². */
  area: Faixa
  quartos: Faixa
  suites?: number
  banheiros: Faixa
  /** `null` quando a vaga é "a consultar". */
  vagas: Faixa | null
  /** Previsão de entrega no formato AAAA-MM. */
  entrega?: string
  mcmv: boolean
  destaque: boolean
  /** Imóvel exibido no topo da home (ex.: "super destaque" no CRM). */
  heroi?: boolean
  publicadoEm: string
  atualizadoEm: string
  /** Frase curta exibida sob o título, ex.: "Apartamentos de 2 e 3 quartos com suíte em Jaguaribe". */
  chamada: string
  descricao: string[]
  fotos: Foto[]
  /** Foto dos cards. Quando ausente, usa a primeira da galeria. */
  capa?: Foto
  plantas: Planta[]
  lazer: string[]
  proximidades: string[]
  construtora?: string
  unidades?: string
}

/** Dados mínimos para os cards de listagem (o que trafega para o navegador). */
export interface ImovelResumo {
  id: string
  codigo: string
  slug: string
  nome: string
  tipo: TipoImovel
  finalidade: Finalidade
  situacao: Situacao
  local: Pick<Localizacao, 'bairro' | 'cidade'>
  preco: number
  area: Faixa
  quartos: Faixa
  banheiros: Faixa
  vagas: Faixa | null
  entrega?: string
  capa: Foto
}

export interface Cidade {
  nome: string
  slug: string
  bairros: { nome: string; slug: string }[]
}
