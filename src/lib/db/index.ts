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
  // A conexão direta do Supabase (db.<projeto>.supabase.co) só tem IPv6, e a Vercel só sai por IPv4:
  // o build e as funções não conseguem conectar. Em produção é preciso usar o pooler (…pooler.supabase.com).
  if (process.env.VERCEL && /@db\.[^.:/]+\.supabase\.co[:/]/.test(url)) {
    throw new Error(
      'DATABASE_URL usa a conexão direta do Supabase, que não funciona na Vercel (só IPv6). ' +
        'Use a string do "Transaction pooler" (porta 6543, host …pooler.supabase.com), em Supabase > Connect.',
    )
  }
  // No build, vários processos geram páginas ao mesmo tempo; em produção, cada instância é pequena.
  // O pooler do Supabase junta as conexões, então poucas por processo bastam.
  const construindo = process.env.NEXT_PHASE === 'phase-production-build'
  return new pg.Pool({
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.DATABASE_POOL_MAX) || (construindo || process.env.VERCEL ? 3 : 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
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
