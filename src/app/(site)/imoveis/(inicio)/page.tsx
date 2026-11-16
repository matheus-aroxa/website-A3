import { metadadosDaBusca, PaginaBusca } from '../busca'

export const generateMetadata = () => metadadosDaBusca(Promise.resolve(undefined))

export default function Pagina({ searchParams }: PageProps<'/imoveis'>) {
  return <PaginaBusca segmentos={Promise.resolve(undefined)} searchParams={searchParams} />
}
