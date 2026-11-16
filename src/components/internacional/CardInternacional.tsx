import Image from 'next/image'
import Link from 'next/link'
import s from '@/components/imoveis/CardImovel.module.css'
import { Icone } from '@/components/ui/Icone'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'
import type { ImovelResumo } from '@/lib/imoveis/tipos'
import type { Cotacao } from '@/lib/internacional/cotacao'
import {
  formatarArea,
  formatarBanheirosCurto,
  formatarEntregaCurta,
  formatarQuartos,
  formatarVagas,
  precoNoIdioma,
} from '@/lib/internacional/formato'
import { urlImovelInternacional, type Idioma } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'

const SIZES = {
  destaque: '(max-width: 767px) 300px, (max-width: 1100px) 50vw, 440px',
  lista: '(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 340px',
}

/**
 * O card do site em português (components/imoveis/CardImovel) com os textos no idioma: mesma marcação e mesmo CSS.
 * Diferença: o preço principal vem na moeda do idioma (dólar ou euro), com o preço oficial em reais na linha de baixo.
 */
export function CardInternacional({
  imovel: im,
  idioma,
  cotacao,
  variante = 'lista',
  nivelTitulo = 3,
  prioritario = false,
  lista,
}: {
  imovel: ImovelResumo
  idioma: Idioma
  cotacao?: Cotacao
  variante?: 'destaque' | 'lista'
  nivelTitulo?: 2 | 3
  prioritario?: boolean
  lista?: string
}) {
  const d = dicionario(idioma)
  const Titulo = `h${nivelTitulo}` as const
  const preco = precoNoIdioma(im.preco, idioma, cotacao, d)
  const alt = d.imovel.altFoto({ nome: im.nome, tipo: im.tipo, bairro: im.local.bairro, cidade: im.local.cidade, posicao: 0 })
  return (
    <article className={`elevar ${s.card}`} data-variante={variante} data-lista={lista}>
      <div className={s.foto}>
        <Image
          loader={carregadorImagem}
          src={im.capa.src}
          alt={alt}
          fill
          sizes={SIZES[variante]}
          placeholder={im.capa.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={im.capa.blurDataURL}
          loading={prioritario ? 'eager' : 'lazy'}
          fetchPriority={prioritario ? 'high' : undefined}
        />
        <span className={`etiqueta etiqueta-${im.situacao} ${s.etiqueta}`}>{d.imovel.situacao[im.situacao]}</span>
      </div>
      <div className={s.corpo}>
        <span className={s.tipo}>{d.imovel.tipo[im.tipo]}</span>
        <Titulo className={s.nome} translate="no">
          <Link href={urlImovelInternacional(idioma, im.slug)} className={s.link}>
            {im.nome}
          </Link>
        </Titulo>
        <span className={s.local} translate="no">
          <Icone nome="local" tamanho={16} />
          {im.local.bairro}, {im.local.cidade}
        </span>
        <ul className={s.atributos}>
          <li>
            <Icone nome="area" tamanho={17} />
            <span className="sr-only">{d.imovel.areaPrivativa}:</span>
            {formatarArea(im.area, idioma, d)}
          </li>
          {im.tipo !== 'terreno' && (
            <>
              <li>
                <Icone nome="cama" tamanho={17} />
                {formatarQuartos(im.quartos, d)}
              </li>
              <li>
                <Icone nome="banheira" tamanho={17} />
                {formatarBanheirosCurto(im.banheiros, d)}
              </li>
            </>
          )}
          <li>
            <Icone nome="carro" tamanho={17} />
            {formatarVagas(im.vagas, d)}
          </li>
        </ul>
        <div className={s.rodape}>
          <span className={s.preco}>
            <span>{d.imovel.precoAPartirDe}</span>
            <strong>{preco.principal}</strong>
            {preco.reais && <span>{preco.reais}</span>}
          </span>
          <span className={s.extra}>
            {im.entrega && im.situacao !== 'pronto'
              ? d.imovel.entregaCard.replace('{data}', formatarEntregaCurta(im.entrega, d))
              : `${d.imovel.codigo} ${im.codigo}`}
          </span>
        </div>
      </div>
    </article>
  )
}
