'use server'

import { refresh, updateTag } from 'next/cache'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { tags } from '#/server/cache-tags.ts'
import { failure, invalid, success, type ActionState } from '#/lib/action-state.ts'
import { ProfileInput } from './schema.ts'
import { updateProfile } from './server/repo.ts'

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer()
  const parsed = ProfileInput.safeParse({
    displayName: formData.get('displayName') ?? '',
    bio: formData.get('bio') ?? '',
    location: formData.get('location') ?? '',
    website: formData.get('website') ?? '',
  })
  if (!parsed.success) return invalid(parsed.error, formData)

  const handle = await updateProfile(sql, viewer.id, parsed.data)
  if (!handle) return failure('Your account could not be found.')
  updateTag(tags.user(handle))
  refresh() // the sidebar shows the viewer's name
  return success(undefined, 'Profile saved')
}
