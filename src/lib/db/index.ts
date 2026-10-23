// Conexão com o Postgres (Supabase). O schema está em db/schema.sql.
import 'server-only'
import pg from 'pg'

// Numeric e bigint chegam como string por padrão; as consultas convertem o que precisam (::float8, ::int).
// Um pool por processo: em desenvolvimento o hot reload recarregaria o módulo e abriria outro a cada edição.
const globalPool = globalThis as typeof globalThis & { __bancoPool?: pg.Pool }

function criarPool() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não definida (veja .env.example).')
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
  return new pg.Pool({
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  })
}

export const banco = () => (globalPool.__bancoPool ??= criarPool())

export type Cliente = pg.PoolClient

/** Roda `trabalho` numa transação: confirma se terminar, desfaz se lançar erro. */
export async function transacao<T>(trabalho: (cliente: Cliente) => Promise<T>): Promise<T> {
  const cliente = await banco().connect()
  try {
    await cliente.query('BEGIN')
    const resultado = await trabalho(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => {})
    throw erro
  } finally {
    cliente.release()
  }
}
