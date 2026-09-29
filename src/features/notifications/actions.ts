'use server'

import * as z from 'zod'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { publish } from '#/server/realtime/bus.ts'
import type { Page } from '#/features/posts/types.ts'
import type { NotificationView } from './types.ts'
import { getNotificationsPage } from './server/queries.ts'
import { markAllRead } from './server/repo.ts'

export async function markNotificationsReadAction(): Promise<void> {
  const viewer = await requireViewer()
  const changed = await markAllRead(sql, viewer.id)
  if (changed) await publish({ type: 'read', userId: viewer.id, scope: 'notifications' })
}

/** Infinite-scroll pagination for the inbox (sequential by nature, so an action is fine). */
export async function loadNotificationsPageAction(tab: unknown, cursor: string): Promise<Page<NotificationView>> {
  await requireViewer()
  return getNotificationsPage(z.enum(['all', 'mentions']).parse(tab), z.string().max(20).parse(cursor))
}
