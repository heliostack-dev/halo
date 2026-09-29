import * as z from 'zod'
import { Id } from '#/lib/ids.ts'

// Shared between server and client. Everything a post card needs, already authorised for the viewer.

export type AuthorView = { id: string; handle: string; displayName: string; avatarHue: number; verified: boolean }

export type QuotedPostView = {
  id: string
  body: string
  createdAt: string
  author: AuthorView
}

export type PostView = {
  /** Row id of the timeline item (differs from `id` for reposts). Use as React key and cursor. */
  itemId: string
  id: string
  body: string
  createdAt: string
  author: AuthorView
  likeCount: number
  repostCount: number
  replyCount: number
  quoteCount: number
  replyTo: { id: string; handle: string } | null
  quote: QuotedPostView | null
  repostedBy: { handle: string; displayName: string } | null
  viewer: { liked: boolean; reposted: boolean; bookmarked: boolean; isAuthor: boolean }
}

export type Page<T> = { items: T[]; nextCursor: string | null }

export const POST_MAX_LENGTH = 280

export const CreatePostInput = z.object({
  body: z.string().trim().min(1, 'Write something first').max(POST_MAX_LENGTH, `Keep it under ${POST_MAX_LENGTH} characters`),
  replyToId: Id.optional(),
  quoteOfId: Id.optional(),
})
export type CreatePostInput = z.infer<typeof CreatePostInput>
