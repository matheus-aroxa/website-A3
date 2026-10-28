// Medição dos formulários de contato, feita no servidor (src/app/acoes.ts). Só o nome do formulário, o imóvel e os NOMES dos
// campos com erro vão para o banco. O que a pessoa digitou (nome, telefone, mensagem) nunca é lido por aqui.
import 'server-only'
import { cookies, headers } from 'next/headers'
import { after } from 'next/server'
import { coletaAtiva } from './ativa'
import { limparCaminho } from './carga'
import { registrarCarga } from './registrar'
import { COOKIE_EQUIPE } from './tipos'

export async function medirFormulario(
  tipo: 'formulario-enviado' | 'formulario-erro',
  formulario: 'contato' | 'visita' | 'corretor',
  { imovelId, camposComErro }: { imovelId?: string; camposComErro?: string[] } = {},
) {
  if (!coletaAtiva() || (await cookies()).has(COOKIE_EQUIPE)) return
  const cabecalhos = new Headers(await headers())
  let caminho = '/'
  try {
    caminho = limparCaminho(new URL(cabecalhos.get('referer') ?? '').pathname) ?? '/'
  } catch {
    // Sem referência: a página fica como "/".
  }
  after(() =>
    registrarCarga({
      carga: { t: tipo, c: caminho, r: formulario, ...(camposComErro?.length && { d: { campos: camposComErro.slice(0, 10) } }) },
      cabecalhos,
      imovelId,
    }),
  )
}
