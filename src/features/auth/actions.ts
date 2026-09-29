'use server'

import { redirect } from 'next/navigation'
import { sql } from '#/server/db.ts'
import { createSession, destroySession } from '#/server/auth/session.ts'
import { DUMMY_HASH, hashPassword, verifyPassword } from '#/server/auth/password.ts'
import { findUserForLogin, insertUser } from '#/server/auth/repo.ts'
import { failure, invalid, type ActionState } from '#/lib/action-state.ts'
import { LoginInput, SignupInput } from './schema.ts'

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = SignupInput.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, formData)
  const { password, ...profile } = parsed.data

  const created = await insertUser(sql, {
    ...profile,
    passwordHash: await hashPassword(password),
    avatarHue: Math.floor(Math.random() * 360),
  })
  if (created === 'handle_taken') return { status: 'error', fieldErrors: { handle: ['That handle is taken'] }, values: { ...profile } }
  if (created === 'email_taken') return { status: 'error', fieldErrors: { email: ['An account with this email exists'] }, values: { ...profile } }

  await createSession(created.id)
  redirect('/home')
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginInput.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, formData)

  const user = await findUserForLogin(sql, parsed.data.identifier)
  // Always run scrypt so response time doesn't reveal whether the account exists.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) return failure('Wrong email, handle or password.', { identifier: parsed.data.identifier })

  await createSession(user.id)
  redirect((parsed.data.next ?? '/home') as '/home')
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/login')
}
