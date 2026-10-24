import type { Metadata } from 'next'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Rodape } from '@/components/layout/Rodape'
import { Migalhas } from '@/components/ui/Migalhas'
import { site } from '@/lib/site'
import s from '@/components/layout/PaginaTexto.module.css'

export const ensureStatic = 'navigation'

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: `Como a ${site.nome} trata os dados informados nos formulários do site e pelo WhatsApp, conforme a LGPD.`,
  alternates: { canonical: '/politica-de-privacidade' },
}

// Texto-base. Deve ser revisado pelo jurídico/encarregado de dados da A3 antes da publicação.
// Descreve o que o site faz hoje: os formulários não gravam nada (só abrem o WhatsApp), não há cookies de rastreamento
// nem ferramentas de análise. Se isso mudar (Analytics, pixel de anúncios, contatos gravados no banco), atualize o texto.
export default function PoliticaPrivacidade() {
  return (
    <>
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
            Esta política explica como a {site.nome} ({site.creci}) trata os dados pessoais no site, em conformidade com a
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Última atualização: outubro de 2026.
          </p>

          <h2>Quais dados coletamos</h2>
          <ul>
            <li>Nome e WhatsApp que você digita nos formulários de contato, de agendamento de visita e de conversa com o corretor;</li>
            <li>A mensagem, os dias e horários de preferência e o imóvel de interesse, quando você preenche;</li>
            <li>
              Dados técnicos de navegação (como endereço IP e tipo de navegador), registrados pelos provedores de hospedagem
              para manter o site funcionando e seguro.
            </li>
          </ul>

          <h2>Como os formulários funcionam</h2>
          <p>
            O site não guarda em banco de dados o que você digita nos formulários. Ao enviar, montamos uma mensagem com
            esses dados e abrimos o WhatsApp da A3 para que você a envie. O contato só chega até nós quando você envia a
            mensagem no WhatsApp, e a conversa passa a seguir também os termos e a política de privacidade do WhatsApp
            (Meta).
          </p>

          <h2>Para que usamos</h2>
          <p>
            Usamos os dados apenas para responder ao seu contato, agendar visitas, enviar informações sobre imóveis do seu
            interesse e cumprir obrigações legais. A base legal é o seu consentimento, dado ao marcar a autorização no
            formulário, e a execução de procedimentos preliminares a contratos que você solicitar.
          </p>

          <h2>Cookies e rastreamento</h2>
          <p>
            O site não usa cookies de publicidade nem ferramentas de análise ou rastreamento de visitantes. Somente a área
            administrativa, restrita à equipe da A3, usa um cookie de sessão para manter o login.
          </p>

          <h2>Com quem compartilhamos</h2>
          <p>
            Não vendemos dados pessoais. As informações da conversa podem ser compartilhadas com construtoras parceiras ou
            proprietários apenas quando necessário para a negociação que você pediu. O site fica em provedores de
            infraestrutura em nuvem, que processam somente os dados técnicos de navegação.
          </p>

          <h2>Seus direitos</h2>
          <p>
            Você pode pedir a qualquer momento a confirmação de que tratamos seus dados, acesso, correção, portabilidade,
            anonimização ou exclusão, informação sobre com quem os compartilhamos e a revogação do consentimento, pelo
            e-mail <a href={`mailto:${site.email}`}>{site.email}</a> ou pelo WhatsApp {site.telefoneExibicao}.
          </p>

          <h2>Por quanto tempo guardamos</h2>
          <p>
            As conversas ficam no WhatsApp da A3 enquanto houver atendimento em andamento ou pelo prazo exigido por lei.
            Depois disso, são excluídas ou anonimizadas. Você pode pedir a exclusão antes disso, pelos canais acima.
          </p>

          <h2>Quem é a controladora</h2>
          <p>
            A controladora dos dados é a {site.nome} ({site.creci}), {site.endereco.exibicao}.
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
