import postgres from 'postgres'

export type Sql = postgres.Sql<{}>
export type Tx = postgres.TransactionSql<{}>
/** Anything that can run a query: the pool or an open transaction. Repositories accept this. */
export type Db = Sql | Tx

export function createSql(url: string, options: postgres.Options<{}> = {}): Sql {
  // PgBouncer-style poolers (Neon "-pooler" hosts) run in transaction mode: no prepared statements.
  const pooled = /-pooler\./.test(url)
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: !pooled,
    transform: postgres.camel,
    onnotice: () => {},
    ...options,
  })
}
