// Local Postgres without Docker: PGlite (Postgres compiled to WASM) behind the wire protocol.
// Data persists in .data/pglite. Connect with DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { mkdirSync } from 'node:fs'

const port = Number(process.env.PGPORT ?? 5432)
mkdirSync('.data/pglite', { recursive: true })
const db = await PGlite.create('./.data/pglite')
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 50 })
await server.start()
console.log(`PGlite listening on postgres://postgres:postgres@127.0.0.1:${port}/postgres`)

const stop = async () => {
  await server.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
