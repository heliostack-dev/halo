// Applies db/migrations/*.sql in filename order, each in its own transaction.
//   node scripts/migrate.ts          apply pending migrations
//   node scripts/migrate.ts --reset  drop everything first (development only)
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createSql, type Sql } from '../src/server/sql.ts'

const dir = join(import.meta.dirname, '..', 'db', 'migrations')

export async function migrate(sql: Sql, { log = console.log } = {}) {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`
  const applied = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name))
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  for (const name of files) {
    if (applied.has(name)) continue
    const text = await readFile(join(dir, name), 'utf8')
    await sql.begin(async (tx) => {
      await tx.unsafe(text)
      await tx`insert into schema_migrations (name) values (${name})`
    })
    log(`applied ${name}`)
  }
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = createSql(url, { max: 1 })
  if (process.argv.includes('--reset')) {
    if (process.env.NODE_ENV === 'production') throw new Error('Refusing to reset in production')
    await sql.unsafe('drop schema public cascade; create schema public;')
    console.log('reset schema')
  }
  await migrate(sql)
  await sql.end()
}
