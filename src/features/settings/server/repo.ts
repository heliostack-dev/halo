import type { Db } from '#/server/sql.ts'
import type { ProfileInput } from '../schema.ts'

export type EditableProfile = ProfileInput & { handle: string }

export async function getEditableProfile(db: Db, userId: string): Promise<EditableProfile | undefined> {
  const [row] = await db<EditableProfile[]>`
    select handle, display_name, bio, location, website from users where id = ${userId}`
  return row
}

/** Updates the viewer's own profile. Returns the handle (for cache invalidation) or undefined. */
export async function updateProfile(db: Db, userId: string, input: ProfileInput): Promise<string | undefined> {
  const [row] = await db<{ handle: string }[]>`
    update users set ${db(input, 'displayName', 'bio', 'location', 'website')}
    where id = ${userId}
    returning handle`
  return row?.handle
}
