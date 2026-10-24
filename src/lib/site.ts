// Dados institucionais centralizados: usados em layout, rodapé, JSON-LD e metadados.

export const site = {
  nome: 'A3 Soluções Imobiliárias',
  nomeCurto: 'A3 Imobiliária',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.a3solucoesimobiliarias.com.br').replace(/\/$/, ''),
  /** Título da home: a palavra-chave local primeiro, que é o que a pessoa digita ("imobiliária em Paulista"). */
  titulo: 'Imobiliária em Paulista – PE | A3 Soluções Imobiliárias',
  descricao:
    'Apartamentos, casas de condomínio e lançamentos para comprar ou alugar em Paulista, Recife e região, com um corretor da A3 do primeiro contato às chaves.',
  creci: 'CRECI 18568PJ',
  telefone: '+55 81 99148-3731',
  telefoneExibicao: '(81) 99148-3731',
  whatsapp: '5581991483731',
  email: 'a3solucoesimobiliaria1@gmail.com',
  instagram: 'https://www.instagram.com/a3.imobiliaria/',
  instagramUsuario: '@a3.imobiliaria',
  endereco: {
    logradouro: 'Avenida Um, nº 11, Sobreloja',
    bairro: 'Alameda Paulista',
    cidade: 'Paulista',
    uf: 'PE',
    pais: 'BR',
    cep: '53422-260',
    exibicao: 'Avenida Um, nº 11, Sobreloja, Alameda Paulista — Paulista/PE · CEP 53422-260',
  },
  areaAtendida: ['Paulista', 'Igarassu', 'Recife', 'Olinda', 'Jaboatão dos Guararapes'],
} as const

/** Endereço público do bucket S3 com as imagens do site (imóveis em `imoveis/` e `empreendimentos/`, institucionais em `site/`). */
export const URL_IMAGENS = 'https://a3-imoveis-fotos.s3.sa-east-1.amazonaws.com'

/** Imagens institucionais no S3. O nome leva o hash do conteúdo, então o cache pode ser eterno: ao trocar a foto, suba outra e mude o nome aqui. */
export const imagensSite = {
  equipe: {
    src: `${URL_IMAGENS}/site/equipe-a3-solucoes-imobiliarias-469d92656a.jpg`,
    width: 1200,
    height: 800,
    // Miniatura de 16 px embutida, para o espaço não ficar vazio enquanto a foto carrega.
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQIE/8QAHxAAAgICAQUAAAAAAAAAAAAAAQIEEQADIQUSMUFh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABcRAQEBAQAAAAAAAAAAAAAAAAERACH/2gAMAwEAAhEDEQA/AK6XLeZGrb3GgRhmyO8eSu2yXL+a9YvuVVk7FUUBVAcZoCqE2Ghwtj5hXlyCs3//2Q==',
  },
}

/**
 * Open Graph comum a todas as páginas. O Next não mescla `openGraph` entre layout e página: quem define o seu precisa
 * repetir estes campos, senão `og:site_name`, `og:locale` e `og:type` somem do HTML.
 */
export const openGraphBase = { type: 'website', locale: 'pt_BR', siteName: site.nome } as const

export const anoAtual = new Date().getFullYear()

export const mensagensWhatsApp = {
  padrao: 'Olá! Vim pelo site da A3 Soluções Imobiliárias e gostaria de falar com um corretor.',
  financiamento: 'Olá! Vim pelo site da A3 e gostaria de simular um financiamento imobiliário.',
  anunciar: 'Olá! Vim pelo site da A3 e quero anunciar meu imóvel para venda ou aluguel.',
  mcmv: 'Olá! Vi os imóveis do Minha Casa Minha Vida no site da A3 e gostaria de saber se me enquadro.',
}

/** Mensagem do formulário "Quero ser atendido", com o que a pessoa preencheu (campos vazios ficam de fora). */
export function mensagemAtendimento(d: { nome: string; whatsapp: string; email?: string; interesse?: string; mensagem?: string }) {
  const linhas = [
    ['Nome', d.nome],
    ['WhatsApp', d.whatsapp],
    ['E-mail', d.email],
    ['Interesse', d.interesse],
    ['Mensagem', d.mensagem],
  ]
    .filter(([, valor]) => valor)
    .map(([rotulo, valor]) => `${rotulo}: ${valor}`)
  return `Olá! Vim pelo site da A3 e quero ser atendido.\n\n${linhas.join('\n')}`
}

/** Mensagem do formulário "Falar com corretor" de um imóvel, com o que a pessoa preencheu. */
export function mensagemImovel(d: { nome: string; whatsapp: string; mensagem?: string; canal?: string }, imovel: { nome: string; codigo: string }) {
  const linhas = [
    ['Nome', d.nome],
    ['WhatsApp', d.whatsapp],
    ['Contato preferido', d.canal],
    ['Mensagem', d.mensagem],
  ]
    .filter(([, valor]) => valor)
    .map(([rotulo, valor]) => `${rotulo}: ${valor}`)
  return `Olá! Vim pelo site da A3 e tenho interesse no ${imovel.nome} (cód. ${imovel.codigo}).\n\n${linhas.join('\n')}`
}

/** Mensagem do pedido de visita, com o resumo dos dias e horários e o que a pessoa preencheu. */
export function mensagemVisita(
  d: { nome: string; whatsapp: string; mensagem?: string; agenda: string },
  imovel: { nome: string; codigo: string },
) {
  const linhas = [
    ['Nome', d.nome],
    ['WhatsApp', d.whatsapp],
    ['Disponibilidade', d.agenda],
    ['Observações', d.mensagem],
  ]
    .filter(([, valor]) => valor)
    .map(([rotulo, valor]) => `${rotulo}: ${valor}`)
  return `Olá! Vim pelo site da A3 e quero agendar uma visita ao ${imovel.nome} (cód. ${imovel.codigo}).\n\n${linhas.join('\n')}`
}

export function linkWhatsApp(mensagem: string = mensagensWhatsApp.padrao) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mensagem)}`
}

export function urlAbsoluta(caminho: string) {
  return caminho.startsWith('http') ? caminho : `${site.url}${caminho.startsWith('/') ? '' : '/'}${caminho}`
}

/** Imagem de compartilhamento padrão (gerada em src/app/opengraph-image.jpg). */
export const imagemCompartilhamento = {
  url: '/opengraph-image.jpg',
  width: 1200,
  height: 630,
  alt: 'A3 Soluções Imobiliárias — perspectiva ilustrada de condomínio com piscina',
}
