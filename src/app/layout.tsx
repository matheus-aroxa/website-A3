import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Suspense } from 'react'
import { preconnect } from 'react-dom'
import { TopoAoMudarDePagina } from '@/components/layout/TopoAoMudarDePagina'
import { JsonLd } from '@/components/seo/JsonLd'
import { schemaImobiliaria } from '@/lib/seo'
import { URL_IMAGENS, openGraphBase, site } from '@/lib/site'
import './globals.css'

// Auto-hospedada pelo Next (sem requisição ao Google no navegador), com o eixo de
// largura ("wdth") que o protótipo usa nos títulos via font-stretch.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--fonte-archivo',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.titulo,
    // Marca curta no sufixo: sobra espaço para a palavra-chave dentro dos ~60 caracteres que o Google mostra.
    template: `%s | ${site.nomeCurto}`,
  },
  description: site.descricao,
  applicationName: site.nome,
  keywords: [
    'imobiliária em Paulista',
    'apartamentos à venda em Paulista',
    'lançamentos imobiliários Pernambuco',
    'Minha Casa Minha Vida Paulista',
    'imóveis para alugar Recife',
    'imobiliária Jaguaribe',
  ],
  formatDetection: { telephone: false },
  openGraph: openGraphBase,
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
}

export const viewport: Viewport = {
  themeColor: '#0B4A44',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // As fotos vêm de outra origem (S3): abre a conexão enquanto o HTML ainda é lido, antes de a primeira foto ser pedida.
  preconnect(URL_IMAGENS)
  return (
    <html lang="pt-BR" className={archivo.variable} data-scroll-behavior="smooth">
      <body>
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        {/* usePathname() só existe na requisição: sem o Suspense, as rotas de segmento dinâmico (/admin/imoveis/[id]) não prerenderizam. */}
        <Suspense fallback={null}>
          <TopoAoMudarDePagina />
        </Suspense>
        {children}
        <JsonLd dados={schemaImobiliaria()} />
      </body>
    </html>
  )
}
