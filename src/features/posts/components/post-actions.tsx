'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useOptimistic, useState } from 'react'
import { ActionButton, ActionButtonContent, actionButtonStyles } from '#/ui/action-button.tsx'
import { Menu, MenuItem, MenuLink } from '#/ui/menu.tsx'
import { useToast } from '#/ui/toast.tsx'
import { compactNumber } from '#/lib/time.ts'
import { setBookmarkAction, setLikeAction, setRepostAction } from '../actions.ts'
import type { PostView } from '../types.ts'
import styles from './post-card.module.css'

type Counters = { liked: boolean; likeCount: number; reposted: boolean; repostCount: number; bookmarked: boolean }

/**
 * Like / repost / bookmark with optimistic updates. `confirmed` is the last server-acknowledged
 * state; useOptimistic layers the pending intent on top and falls back to it if the action fails.
 */
export function PostActions({ post, signedIn }: { post: PostView; signedIn: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [confirmed, setConfirmed] = useState<Counters>({
    liked: post.viewer.liked, likeCount: post.likeCount,
    reposted: post.viewer.reposted, repostCount: post.repostCount,
    bookmarked: post.viewer.bookmarked,
  })
  const [shown, setShown] = useOptimistic(confirmed, (_current, next: Counters) => next)

  function mutate(next: Counters, run: () => Promise<{ status: string; message?: string }>) {
    if (!signedIn) return router.push('/login')
    startTransition(async () => {
      setShown(next)
      try {
        const result = await run()
        if (result.status !== 'success') throw new Error('failed')
        startTransition(() => setConfirmed(next))
        if (result.message) toast(result.message)
      } catch {
        toast('Something went wrong. Try again.', { tone: 'danger' })
      }
    })
  }

  const toggleLike = () =>
    mutate({ ...shown, liked: !shown.liked, likeCount: shown.likeCount + (shown.liked ? -1 : 1) }, () => setLikeAction(post.id, !shown.liked))
  const toggleRepost = () =>
    mutate({ ...shown, reposted: !shown.reposted, repostCount: shown.repostCount + (shown.reposted ? -1 : 1) }, () => setRepostAction(post.id, !shown.reposted))
  const toggleBookmark = () => mutate({ ...shown, bookmarked: !shown.bookmarked }, () => setBookmarkAction(post.id, !shown.bookmarked))

  const share = async () => {
    const url = `${location.origin}/${post.author.handle}/status/${post.id}`
    try {
      if (navigator.share) await navigator.share({ url })
      else {
        await navigator.clipboard.writeText(url)
        toast('Copied to clipboard')
      }
    } catch {}
  }

  const count = (n: number) => compactNumber(n)

  return (
    <div className={styles.actions} role="group" aria-label="Post actions">
      <Link
        href={`/compose/post?reply=${post.id}`}
        scroll={false}
        className={actionButtonStyles({ tone: 'reply' })}
        aria-label={`Reply, ${post.replyCount} replies`}
        title="Reply"
      >
        <ActionButtonContent icon="reply" count={count(post.replyCount)} />
      </Link>
      <Menu
        label={shown.reposted ? 'Undo repost' : 'Repost'}
        align="start"
        triggerClassName={actionButtonStyles({ tone: 'repost', active: shown.reposted })}
        trigger={<ActionButtonContent icon="repeat" active={shown.reposted} count={count(shown.repostCount)} />}
      >
        <MenuItem icon="repeat" onSelect={toggleRepost}>{shown.reposted ? 'Undo repost' : 'Repost'}</MenuItem>
        <MenuLink icon="quote" href={`/compose/post?quote=${post.id}`}>Quote</MenuLink>
      </Menu>
      <ActionButton icon="heart" tone="like" label={shown.liked ? 'Unlike' : 'Like'} active={shown.liked} count={count(shown.likeCount)} onClick={toggleLike} />
      <ActionButton icon="bookmark" tone="bookmark" label={shown.bookmarked ? 'Remove bookmark' : 'Bookmark'} active={shown.bookmarked} onClick={toggleBookmark} />
      <ActionButton icon="share" tone="share" label="Share" onClick={share} className={styles.share} />
    </div>
  )
}
