import 'server-only'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { hydrate } from '#/features/posts/server/repo.ts'
import type { Page } from '#/features/posts/types.ts'
import { CONVERSATION_KINDS, type NotificationView } from '../types.ts'
import { listNotifications } from './repo.ts'

export type NotificationTab = 'all' | 'mentions'

/** One page of the viewer's inbox. Replies, quotes and mentions carry a full post card. */
export async function getNotificationsPage(tab: NotificationTab, cursor?: string): Promise<Page<NotificationView>> {
  const viewer = await requireViewer()
  const page = await listNotifications(sql, viewer.id, cursor, 30, tab === 'mentions' ? CONVERSATION_KINDS : undefined)
  const cardIds = page.items.flatMap((n) => ((CONVERSATION_KINDS as readonly string[]).includes(n.kind) && n.post ? [n.post.id] : []))
  const cards = new Map((await hydrate(sql, viewer.id, cardIds)).map((p) => [p.id, p]))
  return {
    items: page.items.map((n) => (n.post && cards.has(n.post.id) ? { ...n, card: cards.get(n.post.id) } : n)),
    nextCursor: page.nextCursor,
  }
}
