import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaAdministradores } from '@/components/admin/ListaAdministradores'
import { CorpoPagina, TopoPagina } from '@/components/admin/TopoPagina'
import { listarAdministradores } from '@/lib/admin/administradores'
import s from '@/components/admin/Admin.module.css'

export const metadata: Metadata = { title: 'Administradores' }

// Só o administrador principal vê esta página; os outros são levados para o início do painel (exigirPrincipal).
async function Administradores() {
  return <ListaAdministradores administradores={await listarAdministradores()} />
}

export default function PaginaAdministradores() {
  return (
    <>
      <TopoPagina
        titulo="Administradores"
        descricao="Cadastre quem pode entrar no painel, corrija nome, usuário ou senha e exclua quem não precisa mais de acesso. Só você, o administrador principal, vê esta página."
      />
      <CorpoPagina>
        <Suspense fallback={<p className={s.contagem}>Carregando…</p>}>
          <Administradores />
        </Suspense>
      </CorpoPagina>
    </>
  )
}
