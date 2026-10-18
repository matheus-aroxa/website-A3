import type { Metadata } from 'next'
import Link from 'next/link'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { linkWhatsApp } from '@/lib/site'
import s from '@/components/layout/PaginaTexto.module.css'

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: true },
}

export default function NaoEncontrada() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo" className={`container ${s.pagina}`}>
        <div className={s.conteudo}>
          <span className="sobretitulo">Erro 404</span>
          <h1>Não encontramos esta página</h1>
          <p>
            O imóvel pode ter sido vendido ou alugado, ou o endereço mudou. Veja os imóveis disponíveis ou fale com um
            corretor — ele busca para você.
          </p>
          <div className={s.acoes}>
            <Link href="/imoveis" className="btn btn-mar btn-g">
              Ver imóveis disponíveis
            </Link>
            <a href={linkWhatsApp()} target="_blank" rel="noopener" className="btn btn-contorno btn-g">
              Falar com um corretor
            </a>
          </div>
        </div>
      </main>
      <Rodape />
    </>
  )
}
