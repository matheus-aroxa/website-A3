import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaImoveis } from '@/components/admin/ListaImoveis'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { Icone } from '@/components/ui/Icone'
import { listarCatalogoAdmin, listarConstrutorasDoPainel, type FiltroAdmin } from '@/lib/admin/catalogo'
import { ABAS_ADMIN } from '@/lib/imoveis/consultas-admin'
import { catalogoNoPainel } from '@/lib/imoveis/fonte'
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

/** Catálogo na Viniun (FONTE_IMOVEIS=viniun): o cadastro, as fotos, os destaques e as construtoras são mantidos lá. */
function CatalogoNaViniun() {
  return (
    <>
      <TopoPagina titulo={TITULO} descricao="Os imóveis do site vêm do CRM Viniun." />
      <CorpoPagina>
        <div className={s.vazio}>
          <span className={s.vazioIcone}>
            <Icone nome="predio" tamanho={24} espessura={2} />
          </span>
          <h2>Os imóveis são gerenciados na Viniun</h2>
          <p>
            Cadastre, edite, tire do ar e marque os destaques da home no painel da Viniun. Só entram no site os imóveis marcados
            para aparecer no site, e as mudanças chegam aqui em até uma hora.
          </p>
          <a className="btn btn-sol btn-p" href="https://painel.viniun.com.br/imoveis" target="_blank" rel="noopener">
            Abrir o painel da Viniun
            <Icone nome="externo" tamanho={16} />
          </a>
        </div>
      </CorpoPagina>
    </>
  )
}

export default function PaginaImoveis({ searchParams }: PageProps<'/admin'>) {
  if (!catalogoNoPainel()) return <CatalogoNaViniun />
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
