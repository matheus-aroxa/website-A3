// Pasta dos arquivos enviados pelo painel (fotos). O catálogo em si fica no banco (src/lib/db).
import 'server-only'
import path from 'node:path'

/** Pasta dos dados do painel (ADMIN_DADOS_DIR, padrão ./dados). */
export const pastaDados = () => process.env.ADMIN_DADOS_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'dados')
