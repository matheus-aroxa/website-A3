import { Icone } from '@/components/ui/Icone'
import { linkWhatsApp } from '@/lib/site'
import s from './BotaoWhatsApp.module.css'

/** Botão flutuante. Na página de imóvel o celular usa a barra inferior no lugar dele. */
export function BotaoWhatsApp({
  mensagem,
  somenteDesktop = false,
  rotulo = 'Fale conosco',
  rotuloAcessivel = 'Fale conosco pelo WhatsApp',
}: {
  mensagem?: string
  somenteDesktop?: boolean
  rotulo?: string
  rotuloAcessivel?: string
}) {
  return (
    <a
      href={linkWhatsApp(mensagem)}
      target="_blank"
      rel="noopener"
      data-rastro="botao-flutuante"
      aria-label={rotuloAcessivel}
      className={`btn btn-sol ${s.botao}`}
      data-somente-desktop={somenteDesktop || undefined}
    >
      <Icone nome="whatsapp-logo" tamanho={26} preenchido />
      <span className={s.rotulo}>{rotulo}</span>
    </a>
  )
}
