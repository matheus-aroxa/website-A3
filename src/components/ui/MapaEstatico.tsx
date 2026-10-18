import Image from 'next/image'
import mapa from '@/assets/site/mapa.jpg'
import s from './MapaEstatico.module.css'

/**
 * Prévia de mapa leve: imagem otimizada + link para o Google Maps. Evita carregar o iframe
 * do Google (≈ 500 KB de JS) em toda visita, o que derrubaria o LCP/INP no celular.
 */
export function MapaEstatico({
  consulta,
  legenda,
  altura,
  className,
}: {
  consulta: string
  legenda: string
  altura?: number
  className?: string
}) {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`}
      target="_blank"
      rel="noopener"
      className={`${s.mapa} ${className ?? ''}`}
      style={altura ? { height: altura } : undefined}
      aria-label={`Abrir ${consulta} no Google Maps`}
    >
      <Image src={mapa} alt="" fill sizes="(max-width: 767px) 100vw, 800px" />
      <span className={s.pino} aria-hidden="true">
        <span />
      </span>
      <span className={s.legenda}>{legenda}</span>
    </a>
  )
}
