import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import logo from '@/assets/marca/logo-a3.png'
import logoNegativo from '@/assets/marca/logo-a3-negativo.png'
import { FormularioLogin, FormularioLoginComDestino } from '@/components/admin/FormularioLogin'
import { Icone } from '@/components/ui/Icone'
import { anoAtual, site } from '@/lib/site'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Entrar' }

const RODAPE = `© ${anoAtual} ${site.nome} · ${site.creci}`

// Celular: faixa verde no alto e cartão por cima (protótipo "Painel · entrar · mobile").
// Computador: faixa verde à esquerda e cartão à direita (protótipo "Painel · entrar").
// As partes que só existem num dos dois levam .soCelular / .soComputador.
export default function PaginaEntrar() {
  return (
    <main id="conteudo" className={s.login}>
      <section className={s.loginTopo}>
        <span className={s.loginAnel} aria-hidden="true" />
        <span className={`${s.loginAspas} ${s.soComputador}`} aria-hidden="true">
          ”
        </span>
        <div className={s.loginColuna}>
          {/* PNG original (20 KB): a versão redimensionada pelo otimizador perde nitidez no texto miúdo da logo. */}
          <Image src={logoNegativo} alt={site.nome} width={69} height={60} priority unoptimized className={s.loginLogo} />
          <div className={s.loginChamada}>
            <span className={s.sobretitulo}>Painel administrativo</span>
            <h1>
              Seu site, <span>do seu jeito.</span>
            </h1>
            <p className={s.soCelular}>Edite imóveis e escolha os destaques da home direto do celular.</p>
            <p className={s.soComputador}>
              Edite imóveis, escolha os destaques da home e acompanhe os contatos recebidos. Tudo aparece no site na hora.
            </p>
          </div>
          <span className={`${s.loginRodapeTopo} ${s.soComputador}`}>{RODAPE}</span>
        </div>
      </section>

      <section className={`${s.loginColuna} ${s.loginCorpo}`}>
        <div className={s.loginCartao}>
          <Image src={logo} alt="" width={50} height={44} unoptimized className={`${s.loginLogoCartao} ${s.soComputador}`} />
          <div className={s.loginTitulos}>
            <h2>Entrar no painel</h2>
            <p>Use o acesso enviado pela equipe da A3.</p>
          </div>
          {/* O destino (?de=) só existe na requisição; sem ele, o formulário já aparece pronto. */}
          <Suspense fallback={<FormularioLogin />}>
            <FormularioLoginComDestino />
          </Suspense>
          <Link href="/" className={`${s.loginVoltar} ${s.soComputador}`}>
            <Icone nome="chevron-esquerda" tamanho={15} espessura={2} />
            Voltar para o site
          </Link>
        </div>
        <Link href="/" className={`${s.loginVoltar} ${s.soCelular}`}>
          <Icone nome="chevron-esquerda" tamanho={15} espessura={2} />
          Voltar para o site
        </Link>
        <p className={`${s.loginRodape} ${s.soCelular}`}>{RODAPE}</p>
      </section>
    </main>
  )
}
