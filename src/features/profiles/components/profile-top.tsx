import type { Route } from 'next'
import { TabNav } from '#/ui/tab-nav.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { compactNumber } from '#/lib/time.ts'
import { getProfile } from '../server/queries.ts'
import { ProfileHeader } from './profile-header.tsx'

/** Page chrome + hero + tabs for the profile routes. The profile read is cached per handle. */
export async function ProfileTop({ handle }: { handle: string }) {
  const profile = await getProfile(handle)
  const base = `/${profile.handle}` as const
  return (
    <>
      <PageHeader back title={profile.displayName} subtitle={`${compactNumber(profile.postsCount)} posts`} />
      <ProfileHeader profile={profile} />
      <TabNav
        label="Profile sections"
        items={[
          { href: base as Route, label: 'Posts' },
          { href: `${base}/with_replies` as Route, label: 'Replies' },
          { href: `${base}/likes` as Route, label: 'Likes' },
        ]}
      />
    </>
  )
}
