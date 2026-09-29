import type { Db } from '#/server/sql.ts'
import type { Page } from '#/features/posts/types.ts'
import type { NotificationKind, NotificationView } from '../types.ts'

// Notifications data access. Pure functions of (db, viewer): no Next.js imports.

type Row = Omit<NotificationView, 'createdAt' | 'post' | 'card'> & {
  createdAt: Date
  postId: string | null
  postBody: string | null
  postAuthorHandle: string | null
}

export async function listNotifications(
  db: Db,
  viewerId: string,
  cursor: string | undefined,
  limit = 30,
  kinds?: readonly NotificationKind[],
): Promise<Page<NotificationView>> {
  const rows = await db<Row[]>`
    select n.id::text as id, n.kind, n.created_at, n.read_at is not null as read,
           json_build_object('id', a.id::text, 'handle', a.handle, 'displayName', a.display_name,
                             'avatarHue', a.avatar_hue, 'verified', a.verified) as actor,
           p.id::text as post_id, p.body as post_body, pu.handle as post_author_handle
    from notifications n
    join users a on a.id = n.actor_id
    left join posts p on p.id = n.post_id
    left join users pu on pu.id = p.author_id
    where n.recipient_id = ${viewerId}
      ${kinds ? db`and n.kind = any(${kinds as string[]})` : db``}
      ${cursor ? db`and n.id < ${cursor}` : db``}
    order by n.id desc limit ${limit + 1}`
  const items = rows.slice(0, limit).map((r) => ({
    id: r.id,
    kind: r.kind,
    createdAt: r.createdAt.toISOString(),
    read: r.read,
    actor: r.actor,
    post: r.postId ? { id: r.postId, body: r.postBody ?? '', authorHandle: r.postAuthorHandle ?? '' } : null,
  }))
  return { items, nextCursor: rows.length > limit ? items.at(-1)!.id : null }
}

export async function markAllRead(db: Db, viewerId: string): Promise<number> {
  const rows = await db`update notifications set read_at = now() where recipient_id = ${viewerId} and read_at is null returning id`
  return rows.length
}
