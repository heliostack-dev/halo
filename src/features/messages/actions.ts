'use server'

import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { publish } from '#/server/realtime/bus.ts'
import { failure, invalid, success, type ActionState } from '#/lib/action-state.ts'
import { Id } from '#/lib/ids.ts'
import { SendMessageInput, type MessageView } from './types.ts'
import { getConversation, listMessages, markConversationRead, sendMessage } from './server/repo.ts'

export async function sendMessageAction(conversationId: string, body: string): Promise<ActionState<MessageView>> {
  const viewer = await requireViewer()
  const parsed = SendMessageInput.safeParse({ conversationId, body })
  if (!parsed.success) return invalid(parsed.error)
  const sent = await sendMessage(sql, viewer.id, parsed.data.conversationId, parsed.data.body)
  if (sent === 'not_member') return failure('You can’t send messages in this conversation.')
  await publish({ type: 'message', conversationId: parsed.data.conversationId, memberIds: sent.memberIds, messageId: sent.message.id })
  return success(sent.message)
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const viewer = await requireViewer()
  if (await markConversationRead(sql, viewer.id, Id.parse(conversationId))) {
    await publish({ type: 'read', userId: viewer.id, scope: 'messages' })
  }
}

/** Older history for the scroll-back button. Membership is re-checked on every call. */
export async function loadOlderMessagesAction(conversationId: string, beforeId: string) {
  const viewer = await requireViewer()
  const id = Id.parse(conversationId)
  if (!(await getConversation(sql, viewer.id, id))) throw new Error('Not found')
  return listMessages(sql, id, Id.parse(beforeId), 50)
}
