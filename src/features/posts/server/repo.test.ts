import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeUser, useTestDb } from '#/server/testing.ts'
import {
  ancestors, createPost, deletePost, followingTimeline, hashtagTimeline, hydrate, rankedTimeline, replies,
  searchPosts, setBookmark, setLike, setRepost,
} from './repo.ts'

const db = useTestDb()

async function post(authorId: string, body: string, extra: { replyToId?: string; quoteOfId?: string } = {}) {
  const created = await createPost(db.sql, authorId, { body, ...extra })
  assert.notEqual(created, 'parent_missing')
  return (created as Exclude<typeof created, 'parent_missing'>)
}

test('replies build a thread with root, counts and notifications', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  const root = await post(ada.id, 'root post')
  const r1 = await post(bob.id, 'first reply', { replyToId: root.id })
  const r2 = await post(ada.id, 'reply to reply', { replyToId: r1.id })

  assert.deepEqual(r1.notified, [{ recipientId: ada.id, kind: 'reply', postId: r1.id }])
  assert.deepEqual(await ancestors(db.sql, r2.id), [root.id, r1.id])
  assert.deepEqual((await replies(db.sql, root.id, undefined)).items, [r1.id])

  const [view] = await hydrate(db.sql, ada.id, [root.id])
  assert.equal(view?.replyCount, 1)
  const [child] = await hydrate(db.sql, ada.id, [r2.id])
  assert.deepEqual(child?.replyTo, { id: r1.id, handle: bob.handle })
  assert.equal(await createPost(db.sql, ada.id, { body: 'x', replyToId: '999999' }), 'parent_missing')
})

test('likes, reposts and bookmarks are idempotent and reflected in viewer state', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  const p = await post(ada.id, 'like me')

  assert.equal((await setLike(db.sql, bob.id, p.id, true)).length, 1)
  assert.equal((await setLike(db.sql, bob.id, p.id, true)).length, 0, 'second like is a no-op')
  await setRepost(db.sql, bob.id, p.id, true)
  await setRepost(db.sql, bob.id, p.id, true)
  await setBookmark(db.sql, bob.id, p.id, true)

  const [v] = await hydrate(db.sql, bob.id, [p.id])
  assert.deepEqual([v?.likeCount, v?.repostCount], [1, 1])
  assert.deepEqual(v?.viewer, { liked: true, reposted: true, bookmarked: true, isAuthor: false })

  await setLike(db.sql, bob.id, p.id, false)
  await setRepost(db.sql, bob.id, p.id, false)
  const [after] = await hydrate(db.sql, bob.id, [p.id])
  assert.deepEqual([after?.likeCount, after?.repostCount, after?.viewer.liked], [0, 0, false])
})

test('following timeline includes followed authors and their reposts, paginated by id', async () => {
  const me = await makeUser(db.sql)
  const friend = await makeUser(db.sql)
  const stranger = await makeUser(db.sql)
  await db.sql`insert into follows (follower_id, followee_id) values (${me.id}, ${friend.id})`

  const s = await post(stranger.id, 'stranger post')
  const ids: string[] = []
  for (let i = 0; i < 5; i++) ids.push((await post(friend.id, `friend ${i}`)).id)
  await setRepost(db.sql, friend.id, s.id, true)

  const first = await followingTimeline(db.sql, me.id, undefined, 3)
  assert.equal(first.items.length, 3)
  const second = await followingTimeline(db.sql, me.id, first.nextCursor!, 3)
  assert.equal(second.items.length, 3)
  assert.equal(second.nextCursor, null)

  const views = await hydrate(db.sql, me.id, first.items)
  assert.equal(views[0]?.id, s.id, 'the repost is the newest item and resolves to the original')
  assert.equal(views[0]?.repostedBy?.handle, friend.handle)
})

test('quotes, hashtags, mentions and search', async () => {
  const ada = await makeUser(db.sql, { handle: 'ada_q' })
  const bob = await makeUser(db.sql)
  const original = await post(ada.id, 'original thought')
  const q = await post(bob.id, 'agree with @ada_q about #RSC and #rsc', { quoteOfId: original.id })

  assert.deepEqual(q.notified.map((n) => n.kind).sort(), ['mention', 'quote'])
  assert.deepEqual((await hashtagTimeline(db.sql, 'RSC', undefined)).items, [q.id])
  assert.deepEqual((await searchPosts(db.sql, 'agree', undefined)).items, [q.id])

  const [v] = await hydrate(db.sql, null, [q.id])
  assert.equal(v?.quote?.id, original.id)
  assert.equal(v?.quote?.author.handle, 'ada_q')
  assert.ok((await rankedTimeline(db.sql, undefined)).items.includes(q.id))
})

test('only the author can delete', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  const p = await post(ada.id, 'mine')
  assert.equal(await deletePost(db.sql, bob.id, p.id), false)
  assert.equal(await deletePost(db.sql, ada.id, p.id), true)
})
