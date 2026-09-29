import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actorSummary, groupNotifications } from './group.ts'
import type { NotificationView } from './types.ts'

const actor = (id: string) => ({ id, handle: `u${id}`, displayName: `User ${id}`, avatarHue: 0, verified: false })
const n = (id: string, kind: NotificationView['kind'], actorId: string, postId: string | null, read = true): NotificationView => ({
  id, kind, createdAt: '2026-09-29T00:00:00Z', read, actor: actor(actorId), post: postId ? { id: postId, body: 'b', authorHandle: 'me' } : null,
})

test('groups likes on the same post, keeps newest position and unread state', () => {
  const groups = groupNotifications([
    n('9', 'like', '1', 'p1', false),
    n('8', 'follow', '2', null),
    n('7', 'like', '3', 'p1'),
    n('6', 'like', '1', 'p1'),
    n('5', 'reply', '4', 'p9'),
    n('4', 'follow', '5', null),
  ])
  assert.deepEqual(groups.map((g) => [g.kind, g.actors.map((a) => a.id)]), [
    ['like', ['1', '3']],
    ['follow', ['2', '5']],
    ['reply', ['4']],
  ])
  assert.equal(groups[0]!.read, false)
})

test('actor summary', () => {
  assert.deepEqual(actorSummary([actor('1')]), { first: 'User 1', rest: '' })
  assert.deepEqual(actorSummary([actor('1'), actor('2')]), { first: 'User 1', rest: ' and User 2' })
  assert.deepEqual(actorSummary([actor('1'), actor('2'), actor('3')]), { first: 'User 1', rest: ' and 2 others' })
})
