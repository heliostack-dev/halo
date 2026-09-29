import { Suspense } from 'react'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { FollowListPage } from '#/features/profiles/components/follow-list.tsx'

export default function Page({ params }: PageProps<'/[handle]/followers'>) {
  return (
    <Suspense fallback={<FeedSkeleton count={5} />}>
      <FollowListPage params={params} direction="followers" />
    </Suspense>
  )
}
