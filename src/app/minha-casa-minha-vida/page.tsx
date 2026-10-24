import type { Metadata } from 'next'
import { PaginaMcmv, metadadosMcmv } from '@/components/mcmv/PaginaMcmv'

export const ensureStatic = 'navigation'

export function generateMetadata(): Promise<Metadata> {
  return metadadosMcmv(null)
}

export default function PaginaMinhaCasaMinhaVida() {
  return <PaginaMcmv cidadeSlug={null} />
}
