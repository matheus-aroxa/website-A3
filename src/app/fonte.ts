import { Archivo } from 'next/font/google'

// Auto-hospedada pelo Next (sem requisição ao Google no navegador), com o eixo de largura ("wdth") que o protótipo usa
// nos títulos via font-stretch. Compartilhada pelos layouts raiz do site em português e da área internacional.
export const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--fonte-archivo',
})
