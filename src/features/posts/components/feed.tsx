'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Spinner } from '#/ui/spinner.tsx'
import { Button } from '#/ui/button.tsx'
import { loadFeedPageAction } from '../actions.ts'
import type { FeedKey } from '../feed-key.ts'
import type { Page, PostView } from '../types.ts'
import { PostCard } from './post-card.tsx'
import styles from './feed.module.css'

type FeedProps = {
  feedKey: FeedKey
  /** First page, rendered on the server and streamed in. */
  initial: Page<PostView>
  signedIn: boolean
  empty?: React.ReactNode
}

/**
 * Infinite list. The first page arrives from the server; later pages are fetched with a Server
 * Function when a sentinel scrolls into view. Off-screen cards skip layout and paint via
 * `content-visibility: auto`, which keeps long sessions smooth without a virtualisation library.
 */
export function Feed({ feedKey, initial, signedIn, empty }: FeedProps) {
  const [pages, setPages] = useState<Page<PostView>[]>([initial])
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)

  // A new first page (after refresh() or navigation) replaces everything we had appended.
  const [seen, setSeen] = useState(initial)
  if (seen !== initial) {
    setSeen(initial)
    setPages([initial])
  }

  const cursor = pages.at(-1)!.nextCursor

  function loadMore() {
    if (!cursor || pending) return
    startTransition(async () => {
      try {
        const next = await loadFeedPageAction(feedKey, cursor)
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
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), { rootMargin: '1200px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  })

  // Pages can overlap (new posts shift offsets, the same post reposted twice): show each post once.
  const seenIds = new Set<string>()
  const posts = pages.flatMap((p) => p.items).filter((p) => !seenIds.has(p.id) && seenIds.add(p.id))

  if (posts.length === 0) return <>{empty}</>

  return (
    <div className={styles.feed}>
      {posts.map((post) => (
        <PostCard key={post.itemId} post={post} signedIn={signedIn} />
      ))}
      {cursor ? (
        <div ref={sentinel} className={styles.more}>
          {failed ? <Button variant="outline" size="sm" onClick={() => { setFailed(false); loadMore() }}>Retry</Button> : <Spinner />}
        </div>
      ) : (
        <p className={styles.end}>You’re all caught up</p>
      )}
    </div>
  )
}
