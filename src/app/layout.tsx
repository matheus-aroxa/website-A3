import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { JsonLd } from '@/components/seo/JsonLd'
import { schemaImobiliaria } from '@/lib/seo'
import { site } from '@/lib/site'
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
    default: `${site.nome} | Imóveis à venda, para alugar e lançamentos`,
    template: `%s | ${site.nome}`,
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
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.nome,
  },
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
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <JsonLd dados={schemaImobiliaria()} />
      </body>
    </html>
  )
}
