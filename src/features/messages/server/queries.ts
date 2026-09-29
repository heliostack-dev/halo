import 'server-only'
import { notFound } from 'next/navigation'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { Id } from '#/lib/ids.ts'
import { getConversation, listConversations, listMessages } from './repo.ts'

export async function getInbox() {
  const viewer = await requireViewer()
  return { viewer, conversations: await listConversations(sql, viewer.id) }
}

/** A conversation the viewer belongs to, with its latest messages. 404 for everyone else. */
export async function getConversationScreen(conversationId: string) {
  const viewer = await requireViewer()
  const id = Id.safeParse(conversationId)
  if (!id.success) notFound()
  const conversation = await getConversation(sql, viewer.id, id.data)
  if (!conversation) notFound()
  const messages = await listMessages(sql, conversation.id, undefined, 50)
  return { viewer, conversation, messages }
}
