import type { Route } from 'next'
import { Suspense } from 'react'
import { TabNav } from '#/ui/tab-nav.tsx'
import { EmptyState } from '#/ui/empty-state.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { getFollowList, getProfile } from '../server/queries.ts'
import { UserCell } from './user-cell.tsx'

type Direction = 'followers' | 'following'

/** Followers / Following page body: cached profile chrome, then the personalised list. */
export async function FollowListPage({ params, direction }: { params: Promise<{ handle: string }>; direction: Direction }) {
  const { handle } = await params
  const profile = await getProfile(decodeURIComponent(handle))
  const base = `/${profile.handle}` as const
  return (
    <>
      <PageHeader
        back
        title={profile.displayName}
        subtitle={`@${profile.handle}`}
        tabs={
          <TabNav
            label="Connections"
            items={[
              { href: `${base}/followers` as Route, label: 'Followers' },
              { href: `${base}/following` as Route, label: 'Following' },
            ]}
          />
        }
      />
      <Suspense fallback={<FeedSkeleton count={5} />}>
        <FollowList userId={profile.id} handle={profile.handle} direction={direction} />
      </Suspense>
    </>
  )
}

async function FollowList({ userId, handle, direction }: { userId: string; handle: string; direction: Direction }) {
  const { viewerId, users } = await getFollowList(userId, direction)
  if (users.length === 0) {
    return direction === 'followers' ? (
      <EmptyState title="No followers yet">When someone follows @{handle}, they’ll be listed here.</EmptyState>
    ) : (
      <EmptyState title="Not following anyone">When @{handle} follows someone, they’ll be listed here.</EmptyState>
    )
  }
  return (
    <div role="list">
      {users.map((user) => (
        <div role="listitem" key={user.id}>
          <UserCell user={user} viewerId={viewerId} />
        </div>
      ))}
    </div>
  )
}
