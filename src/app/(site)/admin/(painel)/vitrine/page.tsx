import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EditorVitrine } from '@/components/admin/EditorVitrine'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { obterVitrineAdmin, obterVitrineInternacionalAdmin } from '@/lib/admin/catalogo'
import { DESTAQUES_POR_VEZ, LIMITE_DESTAQUES } from '@/lib/imoveis/repositorio'
import { DADOS_IDIOMA, IDIOMAS_REVISADOS, ehRevisado, type IdiomaRevisado } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Vitrine' }

const TITULO = 'Vitrine'
const DESCRICAO =
  'Escolha o imóvel do topo e os destaques da página inicial: a home em português e, em cada aba de idioma, a página da área internacional. Só imóveis publicados entram.'

/**
 * Uma aba para a home em português e uma para cada idioma revisado da área internacional (/en, /it…). Os idiomas de
 * tradução automática (/ja, /pl…) mostram a vitrine do inglês.
 */
function Abas({ atual }: { atual: IdiomaRevisado | 'pt' }) {
  const abas = [{ codigo: 'pt' as const, nome: 'Português', href: '/admin/vitrine' }, ...IDIOMAS_REVISADOS.map((i) => ({ codigo: i, nome: DADOS_IDIOMA[i].nome, href: `/admin/vitrine?idioma=${i}` }))]
  return (
    <nav className={s.abas} aria-label="Vitrine de qual página">
      {abas.map((a) => (
        <Link key={a.codigo} href={a.href} className={s.aba} aria-current={a.codigo === atual ? 'page' : undefined}>
          <span>{a.nome}</span>
          <strong>{a.codigo.toUpperCase()}</strong>
        </Link>
      ))}
    </nav>
  )
}

async function Vitrine({ busca }: { busca: PageProps<'/admin/vitrine'>['searchParams'] }) {
  const valor = (await busca).idioma
  const idioma = typeof valor === 'string' && ehRevisado(valor) ? valor : null

  if (!idioma) {
    const { vitrine, opcoes } = await obterVitrineAdmin()
    return (
      <>
        <TopoPagina titulo={TITULO} descricao={DESCRICAO}>
          <Abas atual="pt" />
        </TopoPagina>
        <CorpoPagina>
          <EditorVitrine key="pt" inicial={vitrine} opcoes={opcoes} limite={LIMITE_DESTAQUES} porVez={DESTAQUES_POR_VEZ} />
        </CorpoPagina>
      </>
    )
  }

  const { vitrine, opcoes, personalizada } = await obterVitrineInternacionalAdmin(idioma)
  const d = await dicionario(idioma)
  const nome = DADOS_IDIOMA[idioma].nome
  return (
    <>
      <TopoPagina titulo={TITULO} descricao={DESCRICAO}>
        <Abas atual={idioma} />
      </TopoPagina>
      <CorpoPagina>
        <p className={s.contagem}>
          Página inicial em {nome} (<a href={`/${idioma}`} target="_blank" rel="noopener">/{idioma}</a>). Só aparecem aqui os imóveis da área
          internacional (à venda e fora do Minha Casa Minha Vida).{' '}
          {personalizada
            ? 'Esta é a seleção salva para este idioma.'
            : 'Este idioma ainda não foi configurado: abaixo está a seleção automática que a página mostra hoje (os destaques da home em português, completados com os mais recentes). Salve para fixar uma seleção própria.'}
        </p>
        <EditorVitrine
          key={idioma}
          inicial={vitrine}
          opcoes={opcoes}
          limite={LIMITE_DESTAQUES}
          porVez={DESTAQUES_POR_VEZ}
          idioma={idioma}
          titulo={{ inicio: d.inicio.titulo, destaque: d.inicio.tituloDestaque }}
          pagina={`página em ${nome}`}
        />
      </CorpoPagina>
    </>
  )
}

export default function PaginaVitrine({ searchParams }: PageProps<'/admin/vitrine'>) {
  return (
    <Suspense
      fallback={
        <>
          <TopoPagina titulo={TITULO} descricao={DESCRICAO} />
          <CorpoPagina>
            <p className={s.contagem}>Carregando…</p>
          </CorpoPagina>
        </>
      }
    >
      <Vitrine busca={searchParams} />
    </Suspense>
  )
}
