import 'server-only'
import { notFound } from 'next/navigation'
import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import type { FeedKey } from '../feed-key.ts'
import type { Page, PostView } from '../types.ts'
import * as repo from './repo.ts'

// Read side of the posts feature: resolves the viewer, authorises, and hydrates.
// Feeds are personalised (viewer state on every card), so they stream behind <Suspense> uncached.

export async function getFeedPage(key: FeedKey, cursor?: string): Promise<Page<PostView>> {
  const viewer = await getViewer()
  const ids = await feedIds(key, viewer?.id ?? null, cursor)
  return { items: await repo.hydrate(sql, viewer?.id ?? null, ids.items), nextCursor: ids.nextCursor }
}

async function feedIds(key: FeedKey, viewerId: string | null, cursor?: string): Promise<Page<string>> {
  switch (key.kind) {
    case 'following':
      return viewerId ? repo.followingTimeline(sql, viewerId, cursor) : { items: [], nextCursor: null }
    case 'for-you':
      return repo.rankedTimeline(sql, cursor)
    case 'user':
      return repo.userTimeline(sql, key.userId, key.mode, cursor)
    case 'likes':
      return repo.likedBy(sql, key.userId, cursor)
    case 'bookmarks':
      // Bookmarks are private: only ever the viewer's own.
      return viewerId ? repo.bookmarkedBy(sql, viewerId, cursor) : { items: [], nextCursor: null }
    case 'hashtag':
      return repo.hashtagTimeline(sql, key.tag, cursor)
    case 'search':
      return repo.searchPosts(sql, key.q, cursor)
    case 'replies':
      return repo.replies(sql, key.postId, cursor)
  }
}

export type Thread = { ancestors: PostView[]; post: PostView }

/** A post with its ancestor chain. 404s when the post is gone or the handle doesn't match. */
export async function getThread(handle: string, postId: string): Promise<Thread> {
  const viewer = await getViewer()
  const found = await repo.postExists(sql, postId)
  if (!found || found.repostOfId || found.handle.toLowerCase() !== handle.toLowerCase()) notFound()
  const ancestorIds = await repo.ancestors(sql, postId)
  const views = await repo.hydrate(sql, viewer?.id ?? null, [...ancestorIds, postId])
  return { ancestors: views.slice(0, -1), post: views.at(-1)! }
}

export async function getPostForCompose(postId: string): Promise<PostView | null> {
  const viewer = await getViewer()
  const [view] = await repo.hydrate(sql, viewer?.id ?? null, [postId])
  return view ?? null
}
