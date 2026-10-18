// Dados institucionais centralizados: usados em layout, rodapé, JSON-LD e metadados.

export const site = {
  nome: 'A3 Soluções Imobiliárias',
  nomeCurto: 'A3 Imobiliária',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.a3solucoesimobiliarias.com.br').replace(/\/$/, ''),
  descricao:
    'Apartamentos, casas de condomínio e lançamentos para comprar ou alugar em Paulista, Recife e região, com um corretor da A3 do primeiro contato à entrega das chaves.',
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

export const anoAtual = new Date().getFullYear()

export const mensagensWhatsApp = {
  padrao: 'Olá! Vim pelo site da A3 Soluções Imobiliárias e gostaria de falar com um corretor.',
  financiamento: 'Olá! Vim pelo site da A3 e gostaria de simular um financiamento imobiliário.',
  anunciar: 'Olá! Vim pelo site da A3 e quero anunciar meu imóvel para venda ou aluguel.',
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
