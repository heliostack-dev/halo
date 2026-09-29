import * as z from 'zod'
import { Id } from '#/lib/ids.ts'

/** Every paginated post list in the app is one of these. Serialisable, validated on the server. */
export const FeedKey = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('following') }),
  z.object({ kind: z.literal('for-you') }),
  z.object({ kind: z.literal('user'), userId: Id, mode: z.enum(['posts', 'replies']) }),
  z.object({ kind: z.literal('likes'), userId: Id }),
  z.object({ kind: z.literal('bookmarks') }),
  z.object({ kind: z.literal('hashtag'), tag: z.string().min(1).max(50) }),
  z.object({ kind: z.literal('search'), q: z.string().min(1).max(100) }),
  z.object({ kind: z.literal('replies'), postId: Id }),
])
export type FeedKey = z.infer<typeof FeedKey>
