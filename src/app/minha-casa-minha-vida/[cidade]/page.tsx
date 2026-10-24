import type { Metadata } from 'next'
import { PaginaMcmv, metadadosMcmv } from '@/components/mcmv/PaginaMcmv'
import { cidadesComMcmv } from '@/lib/imoveis/mcmv'
import { listarCidades, listarIndice } from '@/lib/imoveis/repositorio'

export const ensureStatic = 'navigation'

// Uma página por cidade que tem imóveis do programa suficientes (ver MIN_MCMV_CIDADE).
export async function generateStaticParams() {
  const [indice, cidades] = await Promise.all([listarIndice(), listarCidades()])
  return cidadesComMcmv(indice, cidades).map((c) => ({ cidade: c.slug }))
}

export async function generateMetadata({ params }: PageProps<'/minha-casa-minha-vida/[cidade]'>): Promise<Metadata> {
  return metadadosMcmv((await params).cidade)
}

export default async function PaginaMinhaCasaMinhaVidaDaCidade({ params }: PageProps<'/minha-casa-minha-vida/[cidade]'>) {
  return <PaginaMcmv cidadeSlug={(await params).cidade} />
}
