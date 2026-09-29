import 'server-only'
import { env } from '../env.ts'
import { createSql, type Sql } from '../sql.ts'
import { RealtimeEvent } from './events.ts'

// Pub/sub with two drivers:
//   postgres — NOTIFY on publish, one LISTEN connection per server instance (needs a direct,
//              non-pooled URL: PgBouncer transaction mode drops LISTEN). Works across instances.
//   memory   — in-process EventTarget. Local dev (PGlite has a single session) and single-node hosts.

type Listener = (event: RealtimeEvent) => void
const CHANNEL = 'hs_events'

const state = globalThis as unknown as { hsBus?: { target: EventTarget; listen?: Promise<Sql> } }
const bus = (state.hsBus ??= { target: new EventTarget() })

function driver(): 'postgres' | 'memory' {
  return env().DATABASE_URL_UNPOOLED ? 'postgres' : 'memory'
}

function emitLocal(event: RealtimeEvent) {
  bus.target.dispatchEvent(new CustomEvent('event', { detail: event }))
}

export async function publish(event: RealtimeEvent): Promise<void> {
  if (driver() === 'memory') return emitLocal(event)
  const { sql } = await import('../db.ts')
  await sql`select pg_notify(${CHANNEL}, ${JSON.stringify(event)})`
}

export function subscribe(listener: Listener): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<RealtimeEvent>).detail)
  bus.target.addEventListener('event', handler)
  if (driver() === 'postgres') ensureListening()
  return () => bus.target.removeEventListener('event', handler)
}

function ensureListening() {
  bus.listen ??= (async () => {
    const listener = createSql(env().DATABASE_URL_UNPOOLED!, { max: 1, idle_timeout: 0 })
    await listener.listen(CHANNEL, (payload) => {
      const parsed = RealtimeEvent.safeParse(JSON.parse(payload))
      if (parsed.success) emitLocal(parsed.data)
    })
    return listener
  })().catch((error) => {
    bus.listen = undefined // retry on next subscribe
    throw error
  })
}
