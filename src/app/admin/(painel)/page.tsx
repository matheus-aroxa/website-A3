import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaImoveis } from '@/components/admin/ListaImoveis'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { listarCatalogoAdmin, type UltimaAlteracao } from '@/lib/admin/catalogo'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Imóveis' }

const TITULO = 'Imóveis do site'
const DESCRICAO = 'Edite, desative ou exclua empreendimentos. As mudanças aparecem no site na hora.'

function tempoDesde(iso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora há pouco'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

function textoAlteracao(alteracao: UltimaAlteracao | null) {
  if (!alteracao) return 'Nenhuma alteração no painel ainda: o site mostra o catálogo do CRM.'
  return `Última alteração no painel ${tempoDesde(alteracao.em)}${alteracao.por ? `, por ${alteracao.por}` : ''}`
}

async function Catalogo() {
  // A sessão já foi lida (connection): a página é sempre da requisição, então o relógio pode ser usado.
  const { itens, alteracao } = await listarCatalogoAdmin()
  return <ListaImoveis itens={itens} titulo={TITULO} descricao={DESCRICAO} alteracao={textoAlteracao(alteracao)} />
}

export default function PaginaImoveis() {
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
      <Catalogo />
    </Suspense>
  )
}
