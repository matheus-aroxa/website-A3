import { Suspense } from 'react'
import { Avisos } from '@/components/admin/Avisos'
import { CabecalhoAdmin, CabecalhoAdminEstatico } from '@/components/admin/NavAdmin'
import s from '@/components/admin/Admin.module.css'

export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.pagina}>
      {/* O caminho atual (link ativo) só existe na requisição. */}
      <Suspense fallback={<CabecalhoAdminEstatico />}>
        <CabecalhoAdmin />
      </Suspense>
      <Avisos>
        <main id="conteudo">{children}</main>
      </Avisos>
    </div>
  )
}
