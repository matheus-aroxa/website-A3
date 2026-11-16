import type { Metadata } from 'next'
import { site } from '@/lib/site'
import NaoEncontrada from './(site)/not-found'
import { archivo } from './fonte'
import './globals.css'

// 404 de endereços que não casam com nenhuma rota. Com dois layouts raiz (o site em português e a área internacional),
// o Next não tem um layout único para montar essa página, então ela traz o próprio <html> (experimental.globalNotFound).
// A página em si é a mesma 404 do site em português.

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: 'Página não encontrada | A3 Imobiliária',
  robots: { index: false, follow: true },
}

export default function NaoEncontradaGlobal() {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>
        <NaoEncontrada />
      </body>
    </html>
  )
}
