import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState } from '#/ui/empty-state.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'

export const metadata: Metadata = { title: 'Home' }

export default function ForYouPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedSection feedKey={{ kind: 'for-you' }} empty={<EmptyState title="It’s quiet here">Be the first to post something today.</EmptyState>} />
    </Suspense>
  )
}
