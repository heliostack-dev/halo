'use client'

import { createContext, use, useEffect, useEffectEvent, useRef, type ReactNode } from 'react'
import type { ClientEvent } from '#/server/realtime/events.ts'

type Handler<T extends ClientEvent['type']> = (event: Extract<ClientEvent, { type: T }>) => void
type Registry = { on<T extends ClientEvent['type']>(type: T, handler: Handler<T>): () => void }

const RealtimeContext = createContext<Registry | null>(null)
const TYPES: ClientEvent['type'][] = ['post', 'notification', 'message', 'read']

/**
 * One EventSource per tab, shared by every subscriber. The browser reconnects on its own after
 * the server ends a stream; for signed-out visitors the server answers 204, which tells
 * EventSource to stop for good — so the provider never needs to know who is signed in.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const target = useRef<EventTarget>(null)
  target.current ??= new EventTarget()

  useEffect(() => {
    const source = new EventSource('/api/events')
    const forward = (e: MessageEvent<string>) => target.current!.dispatchEvent(new CustomEvent(e.type, { detail: JSON.parse(e.data) }))
    for (const type of TYPES) source.addEventListener(type, forward)
    return () => source.close()
  }, [])

  const registry = useRef<Registry>(null)
  registry.current ??= {
    on(type, handler) {
      const listener = (e: Event) => handler((e as CustomEvent).detail)
      target.current!.addEventListener(type, listener)
      return () => target.current!.removeEventListener(type, listener)
    },
  }

  return <RealtimeContext value={registry.current}>{children}</RealtimeContext>
}

/** Subscribe to one realtime event type. The handler always sees the latest props/state. */
export function useRealtime<T extends ClientEvent['type']>(type: T, handler: Handler<T>) {
  const registry = use(RealtimeContext)
  const onEvent = useEffectEvent(handler)
  useEffect(() => registry?.on(type, (event) => onEvent(event)), [registry, type])
}
