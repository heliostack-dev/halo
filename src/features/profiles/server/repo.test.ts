import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeUser, useTestDb } from '#/server/testing.ts'
import { findProfile, relationship } from './repo.ts'
import { followList, setFollow } from './follows.ts'

const db = useTestDb()

test('profiles are found case-insensitively with counters', async () => {
  const ada = await makeUser(db.sql, { handle: 'AdaL', displayName: 'Ada' })
  const bob = await makeUser(db.sql)
  await setFollow(db.sql, bob.id, ada.id, true)

  const profile = await findProfile(db.sql, 'adal')
  assert.equal(profile?.id, ada.id)
  assert.equal(profile?.handle, 'AdaL')
  assert.equal(profile?.followersCount, 1)
  assert.equal(profile?.followingCount, 0)
  assert.match(profile?.createdAt ?? '', /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(await findProfile(db.sql, 'nobody_here'), null)
})

test('relationship reflects both directions', async () => {
  const a = await makeUser(db.sql)
  const b = await makeUser(db.sql)
  assert.deepEqual(await relationship(db.sql, a.id, b.id), { followedByViewer: false, followsViewer: false })
  await setFollow(db.sql, a.id, b.id, true)
  assert.deepEqual(await relationship(db.sql, a.id, b.id), { followedByViewer: true, followsViewer: false })
  await setFollow(db.sql, b.id, a.id, true)
  assert.deepEqual(await relationship(db.sql, a.id, b.id), { followedByViewer: true, followsViewer: true })
})

test('follow lists return users newest first with viewer state', async () => {
  const star = await makeUser(db.sql)
  const f1 = await makeUser(db.sql)
  const f2 = await makeUser(db.sql)
  await setFollow(db.sql, f1.id, star.id, true)
  await setFollow(db.sql, f2.id, star.id, true)
  await setFollow(db.sql, f1.id, f2.id, true)

  const followers = await followList(db.sql, f1.id, star.id, 'followers', undefined)
  assert.deepEqual(followers.items.map((u) => u.id), [f2.id, f1.id])
  assert.equal(followers.items[0]?.followedByViewer, true)
  const following = await followList(db.sql, null, f1.id, 'following', undefined)
  assert.deepEqual(following.items.map((u) => u.id).sort(), [star.id, f2.id].sort())
  assert.equal(await setFollow(db.sql, f1.id, f1.id, true), 'self')
})
