'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '#/ui/button.tsx'
import { Spinner } from '#/ui/spinner.tsx'
import type { Page } from '#/features/posts/types.ts'
import { loadNotificationsPageAction } from '../actions.ts'
import type { NotificationView } from '../types.ts'
import { groupNotifications } from '../group.ts'
import { NotificationRow } from './notification-row.tsx'
import styles from './notifications.module.css'

/** Infinite inbox: first page from the server, later pages via a Server Function. */
export function NotificationList({ tab, initial, empty }: { tab: 'all' | 'mentions'; initial: Page<NotificationView>; empty: React.ReactNode }) {
  const [pages, setPages] = useState([initial])
  const [seen, setSeen] = useState(initial)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)
  if (seen !== initial) {
    setSeen(initial)
    setPages([initial])
  }
  const cursor = pages.at(-1)!.nextCursor

  function loadMore() {
    if (!cursor || pending) return
    startTransition(async () => {
      try {
        const next = await loadNotificationsPageAction(tab, cursor)
        setFailed(false)
        startTransition(() => setPages((list) => (list.at(-1)!.nextCursor === cursor ? [...list, next] : list)))
      } catch {
        setFailed(true)
      }
    })
  }

  useEffect(() => {
    const el = sentinel.current
    if (!el || !cursor || failed) return
    const observer = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && loadMore(), { rootMargin: '800px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  })

  const items = pages.flatMap((p) => p.items)
  if (items.length === 0) return <>{empty}</>
  return (
    <div>
      {groupNotifications(items).map((g) => <NotificationRow key={g.key} group={g} />)}
      {cursor ? (
        <div ref={sentinel} className={styles.more}>
          {failed ? <Button variant="outline" size="sm" onClick={() => { setFailed(false); loadMore() }}>Retry</Button> : <Spinner />}
        </div>
      ) : null}
    </div>
  )
}
