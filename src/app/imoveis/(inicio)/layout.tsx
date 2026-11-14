import { LayoutBusca } from '../busca'

// /imoveis sem filtros no caminho. Fica fora de [...filtros] de propósito: ver o comentário em ../busca.tsx.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutBusca segmentos={Promise.resolve(undefined)}>{children}</LayoutBusca>
}
