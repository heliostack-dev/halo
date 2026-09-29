import type { Db } from '../sql.ts'

// Pure data access for auth. Takes the connection as an argument so tests can pass a PGlite-backed one.

export type AuthUser = { id: string; handle: string; passwordHash: string }

export async function findUserForLogin(db: Db, identifier: string): Promise<AuthUser | undefined> {
  const [user] = await db<AuthUser[]>`
    select id, handle, password_hash from users
    where lower(email) = lower(${identifier}) or lower(handle) = lower(${identifier.replace(/^@/, '')})
    limit 1`
  return user
}

export async function insertUser(
  db: Db,
  input: { handle: string; email: string; passwordHash: string; displayName: string; avatarHue: number },
): Promise<{ id: string; handle: string } | 'handle_taken' | 'email_taken'> {
  const [taken] = await db<{ handleTaken: boolean; emailTaken: boolean }[]>`
    select exists(select 1 from users where lower(handle) = lower(${input.handle})) as handle_taken,
           exists(select 1 from users where lower(email) = lower(${input.email})) as email_taken`
  if (taken?.handleTaken) return 'handle_taken'
  if (taken?.emailTaken) return 'email_taken'
  const [user] = await db<{ id: string; handle: string }[]>`
    insert into users ${db(input, 'handle', 'email', 'passwordHash', 'displayName', 'avatarHue')}
    returning id, handle`
  return user!
}

export async function insertSession(db: Db, s: { tokenHash: string; userId: string; expiresAt: Date; userAgent: string }) {
  await db`insert into sessions ${db(s, 'tokenHash', 'userId', 'expiresAt', 'userAgent')}`
}

export async function findSession(db: Db, tokenHash: string) {
  const [row] = await db<{ userId: string; expiresAt: Date }[]>`
    select user_id, expires_at from sessions where token_hash = ${tokenHash} and expires_at > now()`
  return row
}

export async function extendSession(db: Db, tokenHash: string, expiresAt: Date) {
  await db`update sessions set expires_at = ${expiresAt} where token_hash = ${tokenHash}`
}

export async function deleteSession(db: Db, tokenHash: string) {
  await db`delete from sessions where token_hash = ${tokenHash}`
}

export type Viewer = { id: string; handle: string; displayName: string; avatarHue: number; verified: boolean }

export async function findViewer(db: Db, userId: string): Promise<Viewer | undefined> {
  const [v] = await db<Viewer[]>`select id, handle, display_name, avatar_hue, verified from users where id = ${userId}`
  return v
}
