import Image from 'next/image'
import Link from 'next/link'
import { Icone } from '@/components/ui/Icone'
import {
  etiquetaImovel,
  formatarAreaCurta,
  formatarBanheiros,
  formatarPreco,
  formatarQuartos,
  formatarVagas,
  rodapeCard,
  rotuloPreco,
  rotuloTipo,
} from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import type { ImovelResumo } from '@/lib/imoveis/tipos'
import s from './CardImovel.module.css'

const SIZES = {
  destaque: '(max-width: 767px) 300px, (max-width: 1100px) 50vw, 440px',
  lista: '(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 340px',
}

export function CardImovel({
  imovel,
  variante = 'lista',
  nivelTitulo = 3,
  prioritario = false,
}: {
  imovel: ImovelResumo
  variante?: 'destaque' | 'lista'
  nivelTitulo?: 2 | 3
  /** Primeiros cards visíveis: carregam a imagem sem lazy loading. */
  prioritario?: boolean
}) {
  const Titulo = `h${nivelTitulo}` as const
  const classeEtiqueta = imovel.finalidade === 'aluguel' ? 'etiqueta-aluguel' : `etiqueta-${imovel.situacao}`

  return (
    <article className={`elevar ${s.card}`} data-variante={variante}>
      <div className={s.foto}>
        <Image
          src={imovel.capa.src}
          alt={imovel.capa.alt}
          fill
          sizes={SIZES[variante]}
          placeholder={imovel.capa.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={imovel.capa.blurDataURL}
          loading={prioritario ? 'eager' : 'lazy'}
        />
        <span className={`etiqueta ${classeEtiqueta} ${s.etiqueta}`}>{etiquetaImovel(imovel)}</span>
      </div>
      <div className={s.corpo}>
        <span className={s.tipo}>{rotuloTipo[imovel.tipo]}</span>
        <Titulo className={s.nome}>
          <Link href={urlImovel(imovel.slug)} className={s.link}>
            {imovel.nome}
          </Link>
        </Titulo>
        <span className={s.local}>
          <Icone nome="local" tamanho={16} />
          {imovel.local.bairro}, {imovel.local.cidade}
        </span>
        <ul className={s.atributos}>
          <li>
            <Icone nome="area" tamanho={17} />
            <span className="sr-only">Área privativa:</span>
            {formatarAreaCurta(imovel.area)}
          </li>
          {imovel.tipo !== 'terreno' && (
            <>
              <li>
                <Icone nome="cama" tamanho={17} />
                {formatarQuartos(imovel.quartos)}
              </li>
              <li>
                <Icone nome="banheira" tamanho={17} />
                {formatarBanheiros(imovel.banheiros)}
              </li>
            </>
          )}
          <li>
            <Icone nome="carro" tamanho={17} />
            {formatarVagas(imovel.vagas)}
          </li>
        </ul>
        <div className={s.rodape}>
          <span className={s.preco}>
            <span>{rotuloPreco(imovel.finalidade)}</span>
            <strong>{formatarPreco(imovel.preco, imovel.finalidade)}</strong>
          </span>
          <span className={s.extra}>{rodapeCard(imovel)}</span>
        </div>
      </div>
    </article>
  )
}
