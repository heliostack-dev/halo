import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeUser, useTestDb } from '#/server/testing.ts'
import { createPost, setLike } from '#/features/posts/server/repo.ts'
import { setFollow } from '#/features/profiles/server/follows.ts'
import { listNotifications, markAllRead } from './repo.ts'

const db = useTestDb()

test('lists notifications newest first with actor and post, paginated', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql, { displayName: 'Bob' })
  const created = await createPost(db.sql, ada.id, { body: 'hello world' })
  assert.notEqual(created, 'parent_missing')
  const post = created as Exclude<typeof created, 'parent_missing'>
  await setFollow(db.sql, bob.id, ada.id, true)
  await setLike(db.sql, bob.id, post.id, true)
  await createPost(db.sql, bob.id, { body: 'nice', replyToId: post.id })

  const page = await listNotifications(db.sql, ada.id, undefined, 2)
  assert.deepEqual(page.items.map((n) => n.kind), ['reply', 'like'])
  assert.equal(page.items[1]?.actor.displayName, 'Bob')
  assert.equal(page.items[1]?.post?.body, 'hello world')
  assert.equal(page.items[1]?.read, false)
  const rest = await listNotifications(db.sql, ada.id, page.nextCursor!, 2)
  assert.deepEqual(rest.items.map((n) => n.kind), ['follow'])
  assert.equal(rest.nextCursor, null)

  const mentions = await listNotifications(db.sql, ada.id, undefined, 10, ['reply', 'quote', 'mention'])
  assert.deepEqual(mentions.items.map((n) => n.kind), ['reply'])
})

test('markAllRead only touches the viewer', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  await setFollow(db.sql, ada.id, bob.id, true)
  await setFollow(db.sql, bob.id, ada.id, true)
  assert.equal(await markAllRead(db.sql, ada.id), 1)
  assert.equal((await listNotifications(db.sql, ada.id, undefined)).items[0]?.read, true)
  assert.equal((await listNotifications(db.sql, bob.id, undefined)).items[0]?.read, false)
})
