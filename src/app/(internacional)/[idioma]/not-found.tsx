import type { Metadata } from 'next'
import Link from 'next/link'
import { idioma as idiomaDaRota } from 'next/root-params'
import { RastrearNaoEncontrada } from '@/components/coleta/RastrearNaoEncontrada'
import { CabecalhoInternacional } from '@/components/internacional/CabecalhoInternacional'
import { RodapeInternacional } from '@/components/internacional/RodapeInternacional'
import s from '@/components/layout/PaginaTexto.module.css'
import { ehIdioma, urlInicio, urlSecao, versoes } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { linkWhatsApp, site } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: '404',
  robots: { index: false, follow: true },
}

export default async function NaoEncontradaInternacional() {
  const valor = await idiomaDaRota()
  const idioma = valor && ehIdioma(valor) ? valor : 'en'
  const d = dicionario(idioma)
  return (
    <>
      <CabecalhoInternacional idioma={idioma} versoes={versoes(urlInicio)} />
      <main id="conteudo" className={`container ${s.pagina}`}>
        <div className={s.conteudo}>
          <span className="sobretitulo">404</span>
          <h1>{d.naoEncontrada.titulo}</h1>
          <p>{d.naoEncontrada.texto}</p>
          <div className={s.acoes}>
            <Link href={urlSecao(idioma, 'imoveis')} className="btn btn-mar btn-g">
              {d.naoEncontrada.botao}
            </Link>
            <a href={linkWhatsApp(d.contato.mensagemPadrao)} target="_blank" rel="noopener" className="btn btn-contorno btn-g" data-rastro="pagina-404">
              {d.nav.faleConosco}
            </a>
          </div>
        </div>
      </main>
      <RodapeInternacional idioma={idioma} />
      <RastrearNaoEncontrada />
    </>
  )
}
