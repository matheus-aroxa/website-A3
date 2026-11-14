import { segmentosDaRota } from '@/lib/imoveis/filtros'
import { listarIndice } from '@/lib/imoveis/repositorio'
import { combinacoesDeRota } from '@/lib/imoveis/rotas'
import { LayoutBusca } from '../busca'

// Pré-gera todas as páginas de busca que têm imóveis (categoria × tipo × cidade × bairro). /imoveis sozinho é a rota (inicio).
// Combinações novas que surgirem no catálogo são geradas no primeiro acesso e ficam em cache.
export async function generateStaticParams() {
  const imoveis = await listarIndice()
  return combinacoesDeRota(imoveis)
    .map((rota) => segmentosDaRota(rota))
    .filter((filtros) => filtros.length > 0)
    .map((filtros) => ({ filtros }))
}

export default function Layout({ params, children }: LayoutProps<'/imoveis/[...filtros]'>) {
  return <LayoutBusca segmentos={params.then((p) => p.filtros)}>{children}</LayoutBusca>
}
