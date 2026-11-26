import type { MetadataRoute } from 'next'
import { urlAbsoluta } from '@/lib/site'
import { IDIOMAS_AUTOMATICOS } from '@/lib/internacional/idiomas'

// Só o Googlebot rastreia (para manter a indexação). Ele não entra em /api, /admin nem nas páginas com
// tradução automática da AWS, que são pagas por caractere. Todos os outros robôs ficam fora do site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin', ...IDIOMAS_AUTOMATICOS.map((idioma) => `/${idioma}/`)],
      },
      { userAgent: '*', disallow: '/' },
    ],
    sitemap: urlAbsoluta('/sitemap.xml'),
  }
}
