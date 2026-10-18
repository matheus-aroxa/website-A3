import { Icone } from '@/components/ui/Icone'
import { linkWhatsApp } from '@/lib/site'
import s from './BotaoWhatsApp.module.css'

/** Botão flutuante. Na página de imóvel o celular usa a barra inferior no lugar dele. */
export function BotaoWhatsApp({ mensagem, somenteDesktop = false }: { mensagem?: string; somenteDesktop?: boolean }) {
  return (
    <a
      href={linkWhatsApp(mensagem)}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className={`btn btn-sol ${s.botao}`}
      data-somente-desktop={somenteDesktop || undefined}
    >
      <Icone nome="whatsapp-logo" tamanho={28} preenchido />
    </a>
  )
}
