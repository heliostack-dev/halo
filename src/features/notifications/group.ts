import type { AuthorView, PostView } from '#/features/posts/types.ts'
import type { NotificationKind, NotificationView } from './types.ts'

/** What the inbox renders: one row per (kind, post) for likes/reposts/follows, one per item otherwise. */
export type NotificationGroup = {
  key: string
  kind: NotificationKind
  actors: AuthorView[]
  post: NotificationView['post']
  createdAt: string
  read: boolean
  card?: PostView
}

const GROUPABLE = new Set<NotificationKind>(['like', 'repost', 'follow'])

/**
 * Collapse "A liked your post", "B liked your post" into "A and B liked your post".
 * Keeps the position of the newest entry, merges actors in newest-first order, unread if any is.
 * Pure: runs on each render over every loaded page, so groups also merge across pages.
 */
export function groupNotifications(items: NotificationView[]): NotificationGroup[] {
  const out: NotificationGroup[] = []
  const byKey = new Map<string, NotificationGroup>()
  for (const n of items) {
    if (!GROUPABLE.has(n.kind)) {
      out.push({ key: n.id, kind: n.kind, actors: [n.actor], post: n.post, createdAt: n.createdAt, read: n.read, card: n.card })
      continue
    }
    const key = `${n.kind}:${n.post?.id ?? ''}`
    const existing = byKey.get(key)
    if (existing) {
      if (!existing.actors.some((a) => a.id === n.actor.id)) existing.actors.push(n.actor)
      existing.read &&= n.read
      continue
    }
    const group: NotificationGroup = { key, kind: n.kind, actors: [n.actor], post: n.post, createdAt: n.createdAt, read: n.read }
    byKey.set(key, group)
    out.push(group)
  }
  return out
}

/** "Ada", "Ada and Bob", "Ada and 4 others". */
export function actorSummary(actors: AuthorView[]): { first: string; rest: string } {
  const [first, second] = actors
  if (!first) return { first: '', rest: '' }
  if (actors.length === 1) return { first: first.displayName, rest: '' }
  if (actors.length === 2) return { first: first.displayName, rest: ` and ${second!.displayName}` }
  return { first: first.displayName, rest: ` and ${actors.length - 1} others` }
}
