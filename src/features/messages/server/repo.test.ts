import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeUser, useTestDb } from '#/server/testing.ts'
import { getConversation, getOrCreateDm, listConversations, listMessages, markConversationRead, sendMessage } from './repo.ts'

const db = useTestDb()

test('getOrCreateDm is idempotent in both directions and refuses self/missing', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  const id = await getOrCreateDm(db.sql, ada.id, bob.handle)
  assert.equal(typeof id, 'string')
  assert.equal(await getOrCreateDm(db.sql, bob.id, ada.handle.toUpperCase()), id)
  assert.equal(await getOrCreateDm(db.sql, ada.id, ada.handle), 'self')
  assert.equal(await getOrCreateDm(db.sql, ada.id, 'nobody_here'), 'missing')
})

test('only members can read or send; unread and ordering follow messages', async () => {
  const ada = await makeUser(db.sql)
  const bob = await makeUser(db.sql)
  const eve = await makeUser(db.sql)
  const id = (await getOrCreateDm(db.sql, ada.id, bob.handle)) as string

  assert.equal(await getConversation(db.sql, eve.id, id), undefined)
  assert.equal(await sendMessage(db.sql, eve.id, id, 'intrude'), 'not_member')
  assert.equal((await getConversation(db.sql, ada.id, id))?.other.handle, bob.handle)

  const sent = await sendMessage(db.sql, ada.id, id, 'hi bob')
  assert.notEqual(sent, 'not_member')
  assert.deepEqual((sent as Exclude<typeof sent, 'not_member'>).memberIds.sort(), [ada.id, bob.id].sort())
  await sendMessage(db.sql, bob.id, id, 'hey ada')

  const forAda = await listConversations(db.sql, ada.id)
  assert.equal(forAda[0]?.lastMessage?.body, 'hey ada')
  assert.equal(forAda[0]?.unread, true)
  assert.equal((await listConversations(db.sql, bob.id))[0]?.unread, false, 'sender has read their own message')

  assert.equal(await markConversationRead(db.sql, ada.id, id), true)
  assert.equal(await markConversationRead(db.sql, ada.id, id), false, 'nothing left to mark')
  assert.equal((await listConversations(db.sql, ada.id))[0]?.unread, false)

  const history = await listMessages(db.sql, id, undefined, 1)
  assert.deepEqual(history.items.map((m) => m.body), ['hey ada'])
  const older = await listMessages(db.sql, id, history.olderCursor!, 10)
  assert.deepEqual(older.items.map((m) => m.body), ['hi bob'])
  assert.equal(older.olderCursor, null)
})
