import { Suspense } from 'react'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { ProfileFeed } from '#/features/profiles/components/profile-feed.tsx'

export default function Page({ params }: PageProps<'/[handle]/with_replies'>) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <ProfileFeed params={params} tab="replies" />
    </Suspense>
  )
}
