import { Suspense } from 'react'
import { Avisos } from '@/components/admin/Avisos'
import { CabecalhoAdmin, CabecalhoAdminEstatico } from '@/components/admin/NavAdmin'
import { obterAdmin } from '@/lib/admin/acesso'
import s from '@/components/admin/Admin.module.css'

async function Cabecalho() {
  return <CabecalhoAdmin principal={(await obterAdmin())?.principal ?? false} />
}

export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.pagina}>
      {/* O caminho atual (link ativo) e o administrador logado só existem na requisição. */}
      <Suspense fallback={<CabecalhoAdminEstatico />}>
        <Cabecalho />
      </Suspense>
      <Avisos>
        <main id="conteudo">{children}</main>
      </Avisos>
    </div>
  )
}
