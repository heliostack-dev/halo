import * as z from 'zod'
import { Id } from '#/lib/ids.ts'
import type { AuthorView } from '#/features/posts/types.ts'

export type ConversationSummary = {
  id: string
  other: AuthorView
  lastMessage: { body: string; senderId: string; createdAt: string } | null
  unread: boolean
}

export type MessageView = { id: string; senderId: string; body: string; createdAt: string }

export type ConversationView = { id: string; other: AuthorView; memberIds: string[] }

export const MESSAGE_MAX_LENGTH = 1000

export const SendMessageInput = z.object({
  conversationId: Id,
  body: z.string().trim().min(1, 'Write a message').max(MESSAGE_MAX_LENGTH, `Keep it under ${MESSAGE_MAX_LENGTH} characters`),
})
