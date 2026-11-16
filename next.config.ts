import type { NextConfig } from 'next'
import { HOSTS_FOTOS } from './src/lib/imoveis/hosts-fotos'

const nextConfig: NextConfig = {
  // Shell estático + streaming (Partial Prerendering). Páginas de imóvel e a home
  // saem 100% estáticas; a busca entrega o shell na hora e transmite os resultados.
  cacheComponents: true,
  // Com o catálogo na Viniun (docs/integracao-viniun.md), a primeira carga com a cópia das fichas vazia baixa ~330 fichas
  // (~40 s, pelo limite de chamadas deles). O padrão (60 s, e 54 s para cada "use cache") fica justo demais.
  staticPageGenerationTimeout: 180,
  partialPrefetching: true,
  experimental: {
    // 404 de endereços sem rota (app/global-not-found.tsx): há dois layouts raiz, o do site em português e o da área internacional.
    globalNotFound: true,
  },
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Fotos do catálogo vêm do CDN do Supremo.
    remotePatterns: HOSTS_FOTOS.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Painel administrativo: fora dos buscadores e sem cache intermediário.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}

export default nextConfig
