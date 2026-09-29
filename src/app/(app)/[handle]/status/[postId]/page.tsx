import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getViewer } from '#/server/auth/viewer.ts'
import { Id } from '#/lib/ids.ts'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { getThread } from '#/features/posts/server/queries.ts'
import { PostCard } from '#/features/posts/components/post-card.tsx'
import { PostDetail } from '#/features/posts/components/post-detail.tsx'
import { ViewerComposer } from '#/features/posts/components/viewer-composer.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'

export default function StatusPage({ params }: PageProps<'/[handle]/status/[postId]'>) {
  return (
    <>
      <PageHeader back title="Post" />
      <Suspense fallback={<FeedSkeleton count={2} />}>
        <Thread params={params} />
      </Suspense>
    </>
  )
}

async function Thread({ params }: Pick<PageProps<'/[handle]/status/[postId]'>, 'params'>) {
  const { handle, postId } = await params
  const id = Id.safeParse(postId)
  if (!id.success) notFound()
  const [thread, viewer] = await Promise.all([getThread(decodeURIComponent(handle), id.data), getViewer()])
  const signedIn = viewer !== null

  return (
    <>
      {thread.ancestors.map((post) => (
        <PostCard key={post.itemId} post={post} signedIn={signedIn} threadLine />
      ))}
      <PostDetail post={thread.post} signedIn={signedIn} hasAncestors={thread.ancestors.length > 0} />
      <ViewerComposer replyToId={thread.post.id} placeholder="Post your reply" />
      <Suspense fallback={<FeedSkeleton count={3} />}>
        <FeedSection key={thread.post.id} feedKey={{ kind: 'replies', postId: thread.post.id }} />
      </Suspense>
    </>
  )
}
