import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaImoveis } from '@/components/admin/ListaImoveis'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { listarCatalogoAdmin, listarConstrutorasDoPainel, type FiltroAdmin } from '@/lib/admin/catalogo'
import { ABAS_ADMIN } from '@/lib/imoveis/consultas-admin'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Imóveis' }

const TITULO = 'Imóveis do site'
const DESCRICAO = 'Cadastre, edite, desative ou exclua empreendimentos. As mudanças aparecem no site na hora.'

type Busca = Record<string, string | string[] | undefined>

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Filtros vindos da URL (?aba=&q=&situacao=&finalidade=&pagina=), com valores inválidos descartados. */
function filtroDaUrl(busca: Busca): FiltroAdmin {
  const aba = ABAS_ADMIN.find((a) => a === primeiro(busca.aba)) ?? 'ativo'
  const finalidade = ['venda', 'aluguel'].find((f) => f === primeiro(busca.finalidade)) ?? ''
  return {
    aba,
    q: primeiro(busca.q).slice(0, 80),
    situacao: primeiro(busca.situacao).slice(0, 20),
    finalidade,
    construtora: /^\d{1,9}$/.test(primeiro(busca.construtora)) ? primeiro(busca.construtora) : '',
    pagina: Math.max(1, Number.parseInt(primeiro(busca.pagina), 10) || 1),
  }
}

async function Catalogo({ busca }: { busca: Promise<Busca> }) {
  const filtro = filtroDaUrl(await busca)
  // A sessão já foi lida (connection): a página é sempre da requisição, então o relógio pode ser usado.
  const [catalogo, construtoras] = await Promise.all([listarCatalogoAdmin(filtro), listarConstrutorasDoPainel()])
  return <ListaImoveis catalogo={catalogo} filtro={filtro} construtoras={construtoras} titulo={TITULO} descricao={DESCRICAO} />
}

export default function PaginaImoveis({ searchParams }: PageProps<'/admin'>) {
  return (
    <Suspense
      fallback={
        <>
          <TopoPagina titulo={TITULO} descricao={DESCRICAO} />
          <CorpoPagina>
            <p className={s.contagem}>Carregando catálogo…</p>
          </CorpoPagina>
        </>
      }
    >
      <Catalogo busca={searchParams} />
    </Suspense>
  )
}
