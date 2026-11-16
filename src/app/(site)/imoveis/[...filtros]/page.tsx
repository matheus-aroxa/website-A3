import { metadadosDaBusca, PaginaBusca } from '../busca'

type Props = PageProps<'/imoveis/[...filtros]'>

export const generateMetadata = ({ params }: Props) => metadadosDaBusca(params.then((p) => p.filtros))

export default function Pagina({ params, searchParams }: Props) {
  return <PaginaBusca segmentos={params.then((p) => p.filtros)} searchParams={searchParams} />
}
