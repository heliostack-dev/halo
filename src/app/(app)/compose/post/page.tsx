import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ComposeRoute } from '#/features/posts/components/compose-route.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'

export const metadata: Metadata = { title: 'Compose' }

/** Direct visits (refresh, shared link) get the dialog over an empty timeline. */
export default function ComposePage({ searchParams }: PageProps<'/compose/post'>) {
  return (
    <>
      <FeedSkeleton count={3} />
      <Suspense>
        <ComposeRoute searchParams={searchParams} />
      </Suspense>
    </>
  )
}
