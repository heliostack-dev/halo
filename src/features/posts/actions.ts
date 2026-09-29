'use server'

import { refresh, updateTag } from 'next/cache'
import * as z from 'zod'
import { sql } from '#/server/db.ts'
import { requireViewer, getViewer } from '#/server/auth/viewer.ts'
import { publish } from '#/server/realtime/bus.ts'
import { failure, invalid, success, type ActionState } from '#/lib/action-state.ts'
import { Id } from '#/lib/ids.ts'
import { FeedKey } from './feed-key.ts'
import { CreatePostInput, type Page, type PostView } from './types.ts'
import { getFeedPage } from './server/queries.ts'
import * as repo from './server/repo.ts'
import { tags } from '#/server/cache-tags.ts'

export async function createPostAction(_prev: ActionState<{ id: string; handle: string }>, formData: FormData): Promise<ActionState<{ id: string; handle: string }>> {
  const viewer = await requireViewer()
  const parsed = CreatePostInput.safeParse({
    body: formData.get('body'),
    replyToId: formData.get('replyToId') || undefined,
    quoteOfId: formData.get('quoteOfId') || undefined,
  })
  if (!parsed.success) return invalid(parsed.error, formData)

  const created = await repo.createPost(sql, viewer.id, parsed.data)
  if (created === 'parent_missing') return failure('That post is no longer available.')

  updateTag(tags.user(viewer.handle))
  await publish({ type: 'post', authorId: viewer.id, postId: created.id })
  for (const n of created.notified) await publish({ type: 'notification', recipientId: n.recipientId })
  refresh()
  return success({ id: created.id, handle: viewer.handle }, parsed.data.replyToId ? 'Your reply was sent.' : 'Your post was sent.')
}

export async function deletePostAction(postId: string): Promise<ActionState> {
  const viewer = await requireViewer()
  const id = Id.parse(postId)
  if (!(await repo.deletePost(sql, viewer.id, id))) return failure('You can only delete your own posts.')
  updateTag(tags.user(viewer.handle))
  refresh()
  return success(undefined, 'Post deleted.')
}

const Toggle = z.object({ postId: Id, on: z.boolean() })

export async function setLikeAction(postId: string, on: boolean): Promise<ActionState> {
  const viewer = await requireViewer()
  const input = Toggle.parse({ postId, on })
  const notified = await repo.setLike(sql, viewer.id, input.postId, input.on)
  for (const n of notified) await publish({ type: 'notification', recipientId: n.recipientId })
  return success(undefined)
}

export async function setRepostAction(postId: string, on: boolean): Promise<ActionState> {
  const viewer = await requireViewer()
  const input = Toggle.parse({ postId, on })
  const notified = await repo.setRepost(sql, viewer.id, input.postId, input.on)
  for (const n of notified) await publish({ type: 'notification', recipientId: n.recipientId })
  if (input.on) await publish({ type: 'post', authorId: viewer.id, postId: input.postId })
  return success(undefined, input.on ? 'Reposted.' : undefined)
}

export async function setBookmarkAction(postId: string, on: boolean): Promise<ActionState> {
  const viewer = await requireViewer()
  const input = Toggle.parse({ postId, on })
  await repo.setBookmark(sql, viewer.id, input.postId, input.on)
  return success(undefined, input.on ? 'Added to your Bookmarks.' : 'Removed from your Bookmarks.')
}

/**
 * Infinite-scroll pagination. A Server Function is acceptable here because pages load strictly
 * one after another; never use actions for parallel reads.
 */
export async function loadFeedPageAction(key: unknown, cursor: string): Promise<Page<PostView>> {
  const feed = FeedKey.parse(key)
  if (feed.kind === 'following' || feed.kind === 'bookmarks') await requireViewer()
  return getFeedPage(feed, z.string().max(40).parse(cursor))
}

/** Number of unseen posts in the viewer's following timeline (for the "Show N posts" pill). */
export async function countNewPostsAction(sinceId: string): Promise<number> {
  const viewer = await getViewer()
  if (!viewer) return 0
  return repo.countNewSince(sql, viewer.id, Id.parse(sinceId))
}
