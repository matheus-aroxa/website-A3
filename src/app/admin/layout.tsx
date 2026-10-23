import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel A3' },
  robots: { index: false, follow: false },
}

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return children
}
