import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { EmptyState } from '#/ui/empty-state.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { getHashtagCount, normalizeTag } from '#/features/explore/server/hashtags.ts'

// Static title: reading params in generateMetadata would make the route block on request data.
export const metadata: Metadata = { title: 'Hashtag' }

export default function HashtagPage({ params }: PageProps<'/hashtag/[tag]'>) {
  return (
    <Suspense fallback={<><PageHeader back title="Hashtag" /><FeedSkeleton /></>}>
      {params.then(({ tag: raw }) => {
        const tag = normalizeTag(raw)
        if (!tag) notFound()
        return <Hashtag tag={tag} />
      })}
    </Suspense>
  )
}

function Hashtag({ tag }: { tag: string }) {
  return (
    <>
      <PageHeader back title={`#${tag}`} subtitle={<Suspense fallback="…"><PostCount tag={tag} /></Suspense>} />
      <Suspense fallback={<FeedSkeleton />}>
        <FeedSection
          feedKey={{ kind: 'hashtag', tag }}
          empty={<EmptyState title={`No posts with #${tag} yet`}>Be the first to use it.</EmptyState>}
        />
      </Suspense>
    </>
  )
}

async function PostCount({ tag }: { tag: string }) {
  const n = await getHashtagCount(tag)
  return <>{n === 1 ? '1 post' : `${n.toLocaleString('en')} posts`}</>
}
