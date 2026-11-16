import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { preconnect } from 'react-dom'
import { Rastreador } from '@/components/coleta/Rastreador'
import { TopoAoMudarDePagina } from '@/components/layout/TopoAoMudarDePagina'
import { JsonLd } from '@/components/seo/JsonLd'
import { coletaAtiva } from '@/lib/coleta/ativa'
import { fonteDosImoveis } from '@/lib/imoveis/fonte'
import { HOST_VINIUN_FOTOS } from '@/lib/imoveis/hosts-fotos'
import { DADOS_IDIOMA, IDIOMAS_REVISADOS, ehRevisado, idiomaDisponivel } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { schemaImobiliaria } from '@/lib/seo'
import { URL_IMAGENS, site } from '@/lib/site'
import { archivo } from '../../fonte'
import '../../globals.css'

// Layout raiz da área internacional (/en, /it, /ja…): próprio, para o <html lang> ser o do idioma.
// O site em português tem o seu em app/(site)/layout.tsx. Trocar de um para o outro recarrega a página.

// Só os revisados são gerados no build; os automáticos (idiomas.ts) são gerados no primeiro acesso, com a tradução.
export function generateStaticParams() {
  return IDIOMAS_REVISADOS.map((idioma) => ({ idioma }))
}

export async function generateMetadata({ params }: LayoutProps<'/[idioma]'>): Promise<Metadata> {
  const { idioma } = await params
  // A imagem de compartilhamento padrão (app/opengraph-image.jpg) precisa do endereço do site mesmo sem idioma válido.
  if (!idiomaDisponivel(idioma)) return { metadataBase: new URL(site.url) }
  const d = await dicionario(idioma)
  return {
    metadataBase: new URL(site.url),
    title: { default: d.inicio.tituloSeo, template: `%s | ${site.nomeCurto}` },
    description: d.inicio.descricaoSeo,
    applicationName: site.nome,
    formatDetection: { telephone: false },
    openGraph: { type: 'website', locale: DADOS_IDIOMA[idioma].ogLocale, siteName: site.nome },
    twitter: { card: 'summary_large_image' },
    // Os idiomas automáticos ficam fora do Google (tradução de máquina, sem revisão).
    robots: ehRevisado(idioma)
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } }
      : { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#0B4A44',
  width: 'device-width',
  initialScale: 1,
}

export default async function LayoutInternacional({ children, params }: LayoutProps<'/[idioma]'>) {
  const { idioma } = await params
  if (!idiomaDisponivel(idioma)) notFound()
  const d = await dicionario(idioma)
  preconnect(URL_IMAGENS)
  if (fonteDosImoveis() === 'viniun') preconnect(`https://${HOST_VINIUN_FOTOS}`)
  return (
    <html lang={DADOS_IDIOMA[idioma].lang} data-traducao={ehRevisado(idioma) ? undefined : 'automatica'} className={archivo.variable} data-scroll-behavior="smooth">
      <body>
        <a href="#conteudo" className="pular-conteudo">
          {d.nav.pularConteudo}
        </a>
        <Suspense fallback={null}>
          <TopoAoMudarDePagina />
          <Rastreador ativo={coletaAtiva()} />
        </Suspense>
        {children}
        <JsonLd dados={schemaImobiliaria({ descricao: d.inicio.descricaoSeo, idioma })} />
      </body>
    </html>
  )
}
