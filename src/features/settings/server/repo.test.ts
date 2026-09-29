import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeUser, useTestDb } from '#/server/testing.ts'
import { ProfileInput } from '../schema.ts'
import { getEditableProfile, updateProfile } from './repo.ts'

const db = useTestDb()

test('updates only the given user’s profile fields', async () => {
  const ada = await makeUser(db.sql, { displayName: 'Ada' })
  const bob = await makeUser(db.sql, { displayName: 'Bob' })
  const input = ProfileInput.parse({ displayName: '  Ada L.  ', bio: 'Poetical science', location: 'London', website: 'https://ada.dev' })

  assert.equal(await updateProfile(db.sql, ada.id, input), ada.handle)
  assert.deepEqual(await getEditableProfile(db.sql, ada.id), {
    handle: ada.handle, displayName: 'Ada L.', bio: 'Poetical science', location: 'London', website: 'https://ada.dev',
  })
  assert.equal((await getEditableProfile(db.sql, bob.id))?.displayName, 'Bob')
})

test('unknown user updates nothing', async () => {
  const input = ProfileInput.parse({ displayName: 'x', bio: '', location: '', website: '' })
  assert.equal(await updateProfile(db.sql, '999999', input), undefined)
})

test('schema rejects invalid websites and long bios', () => {
  assert.equal(ProfileInput.safeParse({ displayName: 'a', bio: '', location: '', website: 'not a url' }).success, false)
  assert.equal(ProfileInput.safeParse({ displayName: 'a', bio: 'x'.repeat(161), location: '', website: '' }).success, false)
  assert.equal(ProfileInput.safeParse({ displayName: ' ', bio: '', location: '', website: '' }).success, false)
})
