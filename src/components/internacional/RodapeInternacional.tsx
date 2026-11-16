import Image from 'next/image'
import Link from 'next/link'
import logoNegativo from '@/assets/marca/logo-a3-negativo.png'
import s from '@/components/layout/Rodape.module.css'
import { urlInicio, urlSecao, type Idioma } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { anoAtual, linkWhatsApp, site } from '@/lib/site'

/** O rodapé do site em português (components/layout/Rodape), com os textos e os links da área internacional. */
export function RodapeInternacional({ idioma, comBarraInferior = false }: { idioma: Idioma; comBarraInferior?: boolean }) {
  const d = dicionario(idioma)
  const imoveis = urlSecao(idioma, 'imoveis')
  const navegacao = [
    { href: imoveis, rotulo: d.nav.imoveis },
    { href: urlSecao(idioma, 'guia'), rotulo: d.nav.guia },
    { href: urlSecao(idioma, 'regiao'), rotulo: d.nav.regiao },
    { href: `${urlInicio(idioma)}#quem-somos`, rotulo: d.inicio.sobreSobretitulo },
  ]
  const buscas = d.rodape.buscas.map((b) => {
    const p = new URLSearchParams()
    if (b.situacao) p.set('situacao', b.situacao)
    if (b.tipo) p.set('tipo', b.tipo)
    if (b.cidade) p.set('cidade', b.cidade)
    return { href: `${imoveis}?${p}`, rotulo: b.rotulo }
  })
  return (
    <footer className={s.rodape} data-barra-inferior={comBarraInferior || undefined}>
      <div className={`container ${s.interno}`}>
        <div className={s.colunas}>
          <div className={s.marca}>
            <Image src={logoNegativo} alt={site.nome} width={101} height={88} />
            <p>{d.marca.descricao}</p>
          </div>
          <nav aria-label={d.rodape.navegacao} className={s.coluna}>
            <strong>{d.rodape.navegacao}</strong>
            {navegacao.map((l) => (
              <Link key={l.href} href={l.href} className={s.link}>
                {l.rotulo}
              </Link>
            ))}
            {/* Outro layout raiz: o Next recarrega a página inteira ao trocar. */}
            <Link href="/" hrefLang="pt-BR" lang="pt-BR" className={s.link}>
              {d.nav.portugues}
            </Link>
          </nav>
          <nav aria-label={d.rodape.buscasFrequentes} className={s.coluna}>
            <strong>{d.rodape.buscasFrequentes}</strong>
            {buscas.map((l) => (
              <Link key={l.href} href={l.href} className={s.link}>
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <div className={`${s.coluna} ${s.atendimento}`}>
            <strong>{d.rodape.atendimento}</strong>
            <span>{d.rodape.atendimentoTexto}</span>
            <address className={s.endereco}>
              <a href={linkWhatsApp(d.contato.mensagemPadrao)} target="_blank" rel="noopener" className={s.link} data-rastro="rodape">
                {site.telefone}
              </a>
              <span>
                {site.endereco.logradouro}, {site.endereco.bairro} — {site.endereco.cidade}/{site.endereco.uf} · {site.endereco.cep} · {d.rodape.pais}
              </span>
            </address>
          </div>
        </div>
        <div className={s.base}>
          <span>
            © {anoAtual} {site.nome} · {site.creci}
          </span>
          <div className={s.linksBase}>
            <Link href={urlSecao(idioma, 'privacidade')} scroll={false} className={s.link}>
              {d.rodape.politica}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
