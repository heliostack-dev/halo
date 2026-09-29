import 'server-only'
import { env } from './env.ts'
import { createSql, type Sql } from './sql.ts'

// One pool per server instance. The global survives dev-server HMR and Vercel Fluid reuse.
const globalForDb = globalThis as unknown as { haloSql?: Sql }

export const sql: Sql = (globalForDb.haloSql ??= createSql(env().DATABASE_URL))
