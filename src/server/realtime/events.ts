import * as z from 'zod'

// Realtime events carry ids only — never content. Clients refetch what they are allowed to see.
export const RealtimeEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('post'), authorId: z.string(), postId: z.string() }),
  z.object({ type: z.literal('notification'), recipientId: z.string() }),
  z.object({ type: z.literal('message'), conversationId: z.string(), memberIds: z.array(z.string()), messageId: z.string() }),
  z.object({ type: z.literal('follow'), followerId: z.string(), followeeId: z.string(), on: z.boolean() }),
  z.object({ type: z.literal('read'), userId: z.string(), scope: z.enum(['notifications', 'messages']) }),
])
export type RealtimeEvent = z.infer<typeof RealtimeEvent>

/** What a browser receives: the event name plus a minimal payload. */
export type ClientEvent =
  | { type: 'post'; postId: string }
  | { type: 'notification' }
  | { type: 'message'; conversationId: string; messageId: string }
  | { type: 'read'; scope: 'notifications' | 'messages' }
