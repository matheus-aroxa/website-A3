import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/marca/logo-a3.png'
import { Icone } from '@/components/ui/Icone'
import { BotaoCompartilhar } from '@/components/ui/BotaoCompartilhar'
import { site } from '@/lib/site'
import { LinkInicio } from './LinkInicio'
import { MenuMobile } from './MenuMobile'
import { LINKS_PRINCIPAIS } from './navegacao'
import s from './Cabecalho.module.css'

export function Cabecalho({
  ativo,
  variante = 'padrao',
}: {
  ativo?: (typeof LINKS_PRINCIPAIS)[number]['chave']
  /** "detalhe": no celular troca o logo por "‹ Imóveis" e mostra o botão de compartilhar. */
  variante?: 'padrao' | 'detalhe'
}) {
  const detalhe = variante === 'detalhe'
  return (
    <header className={s.cabecalho} data-variante={variante}>
      <div className={`container ${s.barra}`}>
        <LinkInicio className={s.logo} aria-label={`${site.nome}, página inicial`}>
          <Image src={logo} alt={site.nome} width={46} height={40} />
        </LinkInicio>
        {detalhe && (
          <Link href="/imoveis" className={s.voltar}>
            <Icone nome="chevron-esquerda" tamanho={22} espessura={2} />
            Imóveis
          </Link>
        )}

        <nav aria-label="Principal" className={s.nav}>
          {LINKS_PRINCIPAIS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={s.navLink}
              aria-current={ativo === l.chave ? 'page' : undefined}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className={s.acoes}>
          {detalhe && <BotaoCompartilhar className={s.compartilhar} />}
          <MenuMobile links={LINKS_PRINCIPAIS} ativo={ativo} />
        </div>
      </div>
    </header>
  )
}
