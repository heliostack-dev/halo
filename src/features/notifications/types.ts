import type { AuthorView, PostView } from '#/features/posts/types.ts'

export type NotificationKind = 'like' | 'repost' | 'reply' | 'quote' | 'mention' | 'follow'

export type NotificationView = {
  id: string
  kind: NotificationKind
  createdAt: string
  read: boolean
  actor: AuthorView
  /** The post the notification is about (the liked post, or the reply/quote/mention itself). */
  post: { id: string; body: string; authorHandle: string } | null
  /** Full card for conversational kinds (reply, quote, mention), hydrated for the viewer. */
  card?: PostView
}

export const CONVERSATION_KINDS = ['reply', 'quote', 'mention'] as const satisfies NotificationKind[]
