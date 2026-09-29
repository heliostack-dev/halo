'use client'

import { useSyncExternalStore } from 'react'
import { fullDate, relativeTime } from '#/lib/time.ts'

// The clock is external state: the server snapshot (null) renders an absolute date, the client
// swaps in "5m" after hydration without a mismatch, and every instance ticks from one timer.
const TICK = 30_000
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined
function subscribe(fn: () => void) {
  listeners.add(fn)
  timer ??= setInterval(() => listeners.forEach((l) => l()), TICK)
  return () => {
    listeners.delete(fn)
    if (!listeners.size) timer = void clearInterval(timer)
  }
}
const now = () => Math.floor(Date.now() / TICK) * TICK

export function RelativeTime({ date }: { date: string }) {
  const current = useSyncExternalStore(subscribe, now, () => null)
  return (
    <time dateTime={date} title={fullDate(date)}>
      {current === null ? relativeTime(date, Date.parse(date) + 86_400_000 * 2) : relativeTime(date, current)}
    </time>
  )
}
