import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useTestDb } from '../testing.ts'
import { hashPassword, verifyPassword } from './password.ts'
import { hashToken, newToken } from './token.ts'
import { findSession, findUserForLogin, insertSession, insertUser } from './repo.ts'

const db = useTestDb()

test('password hashes verify and reject', async () => {
  const hash = await hashPassword('correct horse')
  assert.match(hash, /^scrypt\$32768\$8\$1\$/)
  assert.equal(await verifyPassword('correct horse', hash), true)
  assert.equal(await verifyPassword('wrong', hash), false)
})

test('token hashes are deterministic per secret', async () => {
  const token = newToken()
  assert.equal(await hashToken(token, 's'.repeat(32)), await hashToken(token, 's'.repeat(32)))
  assert.notEqual(await hashToken(token, 's'.repeat(32)), await hashToken(token, 't'.repeat(32)))
})

test('signup rejects duplicate handle and email case-insensitively', async () => {
  const input = { handle: 'Grace', email: 'grace@navy.mil', passwordHash: 'x', displayName: 'Grace', avatarHue: 10 }
  const created = await insertUser(db.sql, input)
  assert.equal(typeof created === 'object' && created.handle, 'Grace')
  assert.equal(await insertUser(db.sql, { ...input, email: 'other@x.io', handle: 'grace' }), 'handle_taken')
  assert.equal(await insertUser(db.sql, { ...input, handle: 'grace2', email: 'GRACE@navy.mil' }), 'email_taken')
  assert.equal((await findUserForLogin(db.sql, '@GRACE'))?.handle, 'Grace')
})

test('expired sessions are not found', async () => {
  const user = await findUserForLogin(db.sql, 'grace')
  assert.ok(user)
  await insertSession(db.sql, { tokenHash: 'live', userId: user.id, expiresAt: new Date(Date.now() + 60_000), userAgent: '' })
  await insertSession(db.sql, { tokenHash: 'dead', userId: user.id, expiresAt: new Date(Date.now() - 1), userAgent: '' })
  assert.equal((await findSession(db.sql, 'live'))?.userId, user.id)
  assert.equal(await findSession(db.sql, 'dead'), undefined)
})
