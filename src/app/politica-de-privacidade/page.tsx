import type { Metadata } from 'next'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { RolarAoTopo } from '@/components/layout/RolarAoTopo'
import { Migalhas } from '@/components/ui/Migalhas'
import { site } from '@/lib/site'
import s from '@/components/layout/PaginaTexto.module.css'

export const ensureStatic = 'navigation'

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: `Como a ${site.nome} coleta, usa e protege os dados enviados pelos formulários do site, conforme a LGPD.`,
  alternates: { canonical: '/politica-de-privacidade' },
}

// Texto-base. Deve ser revisado pelo jurídico/encarregado de dados da A3 antes da publicação.
export default function PoliticaPrivacidade() {
  return (
    <>
      <RolarAoTopo />
      <Cabecalho />
      <main id="conteudo" className={`container ${s.pagina}`}>
        <div className={s.conteudo}>
          <Migalhas
            itens={[
              { nome: 'Início', href: '/' },
              { nome: 'Política de privacidade', href: '/politica-de-privacidade' },
            ]}
          />
          <h1>Política de privacidade</h1>
          <p>
            Esta política explica como a {site.nome} ({site.creci}) trata os dados pessoais enviados pelo site, em
            conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>

          <h2>Quais dados coletamos</h2>
          <ul>
            <li>Nome, WhatsApp e e-mail informados nos formulários de contato e de agendamento de visita;</li>
            <li>Mensagens, preferências de dias e horários e o imóvel de interesse;</li>
            <li>Dados técnicos de navegação necessários ao funcionamento e à segurança do site.</li>
          </ul>

          <h2>Para que usamos</h2>
          <p>
            Usamos os dados apenas para responder ao seu contato, agendar visitas, enviar informações sobre imóveis do seu
            interesse e cumprir obrigações legais. A base legal é o seu consentimento, dado ao marcar a autorização no
            formulário, e a execução de procedimentos preliminares a contratos que você solicitar.
          </p>

          <h2>Com quem compartilhamos</h2>
          <p>
            Os dados ficam no nosso sistema de atendimento (CRM) e podem ser compartilhados com construtoras parceiras ou
            proprietários apenas quando necessário para a negociação que você pediu. Não vendemos dados pessoais.
          </p>

          <h2>Seus direitos</h2>
          <p>
            Você pode pedir a qualquer momento acesso, correção, portabilidade ou exclusão dos seus dados, e revogar o
            consentimento, pelo e-mail <a href={`mailto:${site.email}`}>{site.email}</a> ou pelo WhatsApp{' '}
            {site.telefoneExibicao}.
          </p>

          <h2>Por quanto tempo guardamos</h2>
          <p>
            Mantemos os dados enquanto houver atendimento em andamento ou pelo prazo exigido por lei. Depois disso, eles
            são excluídos ou anonimizados.
          </p>

          <p className={s.aviso}>
            {site.nome} · {site.endereco.exibicao} · {site.creci}
          </p>
        </div>
      </main>
      <Rodape />
    </>
  )
}
