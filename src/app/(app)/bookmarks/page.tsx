import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState } from '#/ui/empty-state.tsx'
import { getViewer } from '#/server/auth/viewer.ts'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'

export const metadata: Metadata = { title: 'Bookmarks' }

export default function BookmarksPage() {
  return (
    <>
      <PageHeader
        title="Bookmarks"
        subtitle={
          <Suspense fallback={' '}>
            <ViewerHandle />
          </Suspense>
        }
      />
      <Suspense fallback={<FeedSkeleton />}>
        <FeedSection
          feedKey={{ kind: 'bookmarks' }}
          empty={<EmptyState title="Save posts for later">Bookmark posts to easily find them again in the future.</EmptyState>}
        />
      </Suspense>
    </>
  )
}

async function ViewerHandle() {
  const viewer = await getViewer()
  return viewer ? `@${viewer.handle}` : null
}
