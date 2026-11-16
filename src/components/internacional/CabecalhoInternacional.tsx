import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/marca/logo-a3.png'
import { LinkInicio } from '@/components/layout/LinkInicio'
import { MenuMobile } from '@/components/layout/MenuMobile'
import s from '@/components/layout/Cabecalho.module.css'
import { BotaoCompartilhar } from '@/components/ui/BotaoCompartilhar'
import { Icone } from '@/components/ui/Icone'
import { urlInicio, urlSecao, type Idioma } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { linkWhatsApp, site } from '@/lib/site'
import { SeletorIdioma, type Versoes } from './SeletorIdioma'

export type SecaoAtiva = 'imoveis' | 'guia' | 'regiao'

/** O cabeçalho do site em português (components/layout/Cabecalho), com os links da área internacional e o seletor de idioma. */
export function CabecalhoInternacional({
  idioma,
  ativo,
  versoes,
  variante = 'padrao',
}: {
  idioma: Idioma
  ativo?: SecaoAtiva
  versoes: Versoes
  /** "detalhe": no celular troca o logo por "‹ Imóveis" e mostra o botão de compartilhar (como na ficha em português). */
  variante?: 'padrao' | 'detalhe'
}) {
  const d = dicionario(idioma)
  const detalhe = variante === 'detalhe'
  const links = [
    { href: urlSecao(idioma, 'imoveis'), rotulo: d.nav.imoveis, chave: 'imoveis' },
    { href: urlSecao(idioma, 'guia'), rotulo: d.nav.guia, chave: 'guia' },
    { href: urlSecao(idioma, 'regiao'), rotulo: d.nav.regiao, chave: 'regiao' },
    { href: `${urlInicio(idioma)}#quem-somos`, rotulo: d.inicio.sobreSobretitulo, chave: 'sobre' },
    { href: `${urlInicio(idioma)}#contato`, rotulo: d.nav.contato, chave: 'contato' },
  ]
  return (
    <header className={s.cabecalho} data-variante={variante}>
      <div className={`container ${s.barra}`}>
        <LinkInicio href={urlInicio(idioma)} className={s.logo} aria-label={`${site.nome}, ${d.nav.inicio}`}>
          <Image src={logo} alt={site.nome} width={46} height={40} />
        </LinkInicio>
        {detalhe && (
          <Link href={urlSecao(idioma, 'imoveis')} className={s.voltar}>
            <Icone nome="chevron-esquerda" tamanho={22} espessura={2} />
            {d.nav.imoveis}
          </Link>
        )}
        <nav aria-label={d.nav.principal} className={s.nav}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={s.navLink} aria-current={ativo === l.chave ? 'page' : undefined}>
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className={s.acoes}>
          {detalhe && (
            <BotaoCompartilhar className={s.compartilhar} textos={{ compartilhar: d.imovel.compartilhar, copiado: d.imovel.linkCopiado }} />
          )}
          <SeletorIdioma idioma={idioma} versoes={versoes} rotulo={d.nav.idioma} portugues={d.nav.portugues} />
          <MenuMobile
            links={links}
            ativo={ativo}
            textos={{ abrir: d.nav.menuAbrir, fechar: d.nav.menuFechar, faleConosco: d.nav.faleConosco }}
            whatsapp={linkWhatsApp(d.contato.mensagemPadrao)}
          />
        </div>
      </div>
    </header>
  )
}
