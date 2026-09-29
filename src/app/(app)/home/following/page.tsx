import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState } from '#/ui/empty-state.tsx'
import { buttonStyles } from '#/ui/button.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { NewPostsPill } from '#/features/posts/components/new-posts-pill.tsx'

export const metadata: Metadata = { title: 'Following' }

export default function FollowingPage() {
  return (
    <>
      <NewPostsPill />
      <Suspense fallback={<FeedSkeleton />}>
        <FeedSection
          feedKey={{ kind: 'following' }}
          empty={
            <EmptyState title="Welcome to your timeline" action={<Link href="/explore" className={buttonStyles()}>Find people to follow</Link>}>
              Posts from people you follow show up here, newest first.
            </EmptyState>
          }
        />
      </Suspense>
    </>
  )
}
