import 'server-only'
import { cookies, headers } from 'next/headers'
import { sql } from '../db.ts'
import { env } from '../env.ts'
import { deleteSession, extendSession, findSession, insertSession } from './repo.ts'
import { hashToken, newToken } from './token.ts'

export const SESSION_COOKIE = 'hs_session'
const DAY = 86_400_000
const LIFETIME = 30 * DAY
const RENEW_WHEN_LEFT = 15 * DAY

export async function createSession(userId: string): Promise<void> {
  const token = newToken()
  const expiresAt = new Date(Date.now() + LIFETIME)
  const userAgent = (await headers()).get('user-agent')?.slice(0, 200) ?? ''
  await insertSession(sql, { tokenHash: await hashToken(token, env().SESSION_SECRET), userId, expiresAt, userAgent })
  await setCookie(token, expiresAt)
}

/** Returns the signed-in user id, or null. Renews the session when it is past half its life. */
export async function readSession(): Promise<{ userId: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const tokenHash = await hashToken(token, env().SESSION_SECRET)
  const session = await findSession(sql, tokenHash)
  if (!session) return null
  if (session.expiresAt.getTime() - Date.now() < RENEW_WHEN_LEFT) {
    const expiresAt = new Date(Date.now() + LIFETIME)
    await extendSession(sql, tokenHash, expiresAt)
    // Cookies can only be written from Server Actions / Route Handlers; ignore during render.
    await setCookie(token, expiresAt).catch(() => {})
  }
  return { userId: session.userId }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await deleteSession(sql, await hashToken(token, env().SESSION_SECRET))
  jar.delete(SESSION_COOKIE)
}

async function setCookie(token: string, expires: Date) {
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
}
