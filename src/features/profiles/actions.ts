'use server'

import { updateTag } from 'next/cache'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { publish } from '#/server/realtime/bus.ts'
import { tags } from '#/server/cache-tags.ts'
import { failure, success, type ActionState } from '#/lib/action-state.ts'
import { Id } from '#/lib/ids.ts'
import { setFollow } from './server/follows.ts'

export async function setFollowAction(userId: string, handle: string, on: boolean): Promise<ActionState> {
  const viewer = await requireViewer()
  const result = await setFollow(sql, viewer.id, Id.parse(userId), on)
  if (result === 'self') return failure('You can’t follow yourself.')
  if (result === 'missing') return failure('That account no longer exists.')
  if (result === 'ok') {
    updateTag(tags.user(handle))
    updateTag(tags.user(viewer.handle))
    await publish({ type: 'follow', followerId: viewer.id, followeeId: userId, on })
    if (on) await publish({ type: 'notification', recipientId: userId })
  }
  return success(undefined)
}
