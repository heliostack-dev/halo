// Test database: a fresh in-memory Postgres (PGlite) per test file, reached through the same
// postgres.js driver the app uses. No Docker, no shared state between files.
import { after, before } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { migrate } from '../../scripts/migrate.ts'
import { createSql, type Sql } from './sql.ts'

export function useTestDb(): { readonly sql: Sql } {
  let pglite: PGlite
  let server: PGLiteSocketServer
  const ctx = {} as { sql: Sql }

  before(async () => {
    pglite = await PGlite.create()
    server = new PGLiteSocketServer({ db: pglite, port: 0, host: '127.0.0.1', maxConnections: 20 })
    await server.start()
    const { port } = (server as unknown as { server: import('node:net').Server }).server.address() as import('node:net').AddressInfo
    ctx.sql = createSql(`postgres://postgres:postgres@127.0.0.1:${port}/postgres`, { max: 4 })
    await migrate(ctx.sql, { log: () => {} })
  })

  after(async () => {
    await ctx.sql?.end()
    await server?.stop()
    await pglite?.close()
  })

  return ctx
}

let seq = 0
/** Insert a user with sensible defaults. */
export async function makeUser(sql: Sql, overrides: Partial<{ handle: string; displayName: string }> = {}) {
  const n = ++seq
  const handle = overrides.handle ?? `user${n}_${Math.random().toString(36).slice(2, 6)}`
  const [u] = await sql<{ id: string; handle: string }[]>`
    insert into users (handle, email, password_hash, display_name)
    values (${handle}, ${`${handle}@test.dev`}, 'x', ${overrides.displayName ?? `User ${n}`})
    returning id, handle`
  return u!
}
