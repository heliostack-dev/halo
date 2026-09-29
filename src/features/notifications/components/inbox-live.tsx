'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Icon } from '#/ui/icon.tsx'
import { useRealtime } from '#/features/realtime/realtime.tsx'
import { markNotificationsReadAction } from '../actions.ts'
import styles from './notifications.module.css'

/**
 * Marks the inbox read once it has been shown, and offers a refresh when new notifications
 * arrive while the page is open (instead of shifting the list under the reader).
 */
export function InboxLive() {
  const router = useRouter()
  const [fresh, setFresh] = useState(0)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    markNotificationsReadAction().catch(() => {})
  }, [])
  useRealtime('notification', () => setFresh((n) => n + 1))

  if (fresh === 0) return null
  return (
    <button
      type="button"
      className={styles.pill}
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          router.refresh()
          setFresh(0)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          markNotificationsReadAction().catch(() => {})
        })
      }
    >
      <Icon name="arrow-up" size={16} />
      New notifications
    </button>
  )
}
