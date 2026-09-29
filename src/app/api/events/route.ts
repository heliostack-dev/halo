import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import { subscribe } from '#/server/realtime/bus.ts'
import type { ClientEvent, RealtimeEvent } from '#/server/realtime/events.ts'

// Server-Sent Events for the signed-in viewer. Serverless functions have a maximum duration,
// so the stream ends itself before the limit; EventSource reconnects automatically (`retry`).
export const maxDuration = 300
const STREAM_LIFETIME_MS = 270_000
const HEARTBEAT_MS = 20_000

export async function GET(request: Request) {
  const viewer = await getViewer()
  // 204 = "no content, don't reconnect" for EventSource.
  if (!viewer) return new Response(null, { status: 204 })

  const rows = await sql<{ id: string }[]>`select followee_id::text as id from follows where follower_id = ${viewer.id}`
  const following = new Set(rows.map((r) => r.id))
  const encoder = new TextEncoder()

  const route = (event: RealtimeEvent): ClientEvent | null => {
    switch (event.type) {
      case 'post':
        return following.has(event.authorId) ? { type: 'post', postId: event.postId } : null
      case 'notification':
        return event.recipientId === viewer.id ? { type: 'notification' } : null
      case 'message':
        return event.memberIds.includes(viewer.id) ? { type: 'message', conversationId: event.conversationId, messageId: event.messageId } : null
      case 'read':
        return event.userId === viewer.id ? { type: 'read', scope: event.scope } : null
      case 'follow':
        if (event.followerId === viewer.id) event.on ? following.add(event.followeeId) : following.delete(event.followeeId)
        return null
    }
  }

  let cleanup = () => {}
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))
      send('retry: 2000\n\n')
      const unsubscribe = subscribe((event) => {
        const out = route(event)
        if (out) send(`event: ${out.type}\ndata: ${JSON.stringify(out)}\n\n`)
      })
      const heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS)
      const end = setTimeout(() => controller.close(), STREAM_LIFETIME_MS)
      cleanup = () => {
        unsubscribe()
        clearInterval(heartbeat)
        clearTimeout(end)
      }
      request.signal.addEventListener('abort', () => {
        cleanup()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
