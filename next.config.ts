import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Shell estático + streaming (Partial Prerendering). Páginas de imóvel e a home
  // saem 100% estáticas; a busca entrega o shell na hora e transmite os resultados.
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Quando o CRM servir as fotos de um domínio próprio, libere-o aqui, por exemplo:
    // remotePatterns: [{ protocol: 'https', hostname: 'fotos.seucrm.com.br' }],
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
    ]
  },
}

export default nextConfig
