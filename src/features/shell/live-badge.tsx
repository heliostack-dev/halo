'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '#/ui/badge.tsx'
import { useRealtime } from '#/features/realtime/realtime.tsx'
import styles from './shell.module.css'

/** Unread count that starts from the server value and follows realtime events. */
export function LiveBadge({ initial, scope }: { initial: number; scope: 'notifications' | 'messages' }) {
  const [count, setCount] = useState(initial)
  const [seen, setSeen] = useState(initial)
  const pathname = usePathname()
  if (seen !== initial) {
    setSeen(initial)
    setCount(initial)
  }
  useRealtime(scope === 'notifications' ? 'notification' : 'message', () => {
    if (!pathname.startsWith(`/${scope}`)) setCount((n) => n + 1)
  })
  useRealtime('read', (e) => e.scope === scope && setCount(0))
  return <Badge count={pathname.startsWith(`/${scope}`) && scope === 'notifications' ? 0 : count} className={styles.badge} />
}
