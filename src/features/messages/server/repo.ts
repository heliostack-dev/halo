import type { Db, Sql } from '#/server/sql.ts'
import type { ConversationSummary, ConversationView, MessageView } from '../types.ts'

// Direct messages data access. Every read takes the viewer and checks membership in SQL.

const authorJson = (alias: string) =>
  `json_build_object('id', ${alias}.id::text, 'handle', ${alias}.handle, 'displayName', ${alias}.display_name, 'avatarHue', ${alias}.avatar_hue, 'verified', ${alias}.verified)`

export async function listConversations(db: Db, viewerId: string): Promise<ConversationSummary[]> {
  const rows = await db<(Omit<ConversationSummary, 'lastMessage'> & { lastBody: string | null; lastSenderId: string | null; lastAt: Date | null })[]>`
    select c.id::text as id, ${db.unsafe(authorJson('u'))} as other,
           m.body as last_body, m.sender_id::text as last_sender_id, m.created_at as last_at,
           (m.id is not null and m.sender_id <> ${viewerId} and m.created_at > me.last_read_at) as unread
    from conversation_members me
    join conversations c on c.id = me.conversation_id
    join conversation_members them on them.conversation_id = c.id and them.user_id <> me.user_id
    join users u on u.id = them.user_id
    left join lateral (
      select id, body, sender_id, created_at from messages where conversation_id = c.id order by id desc limit 1
    ) m on true
    where me.user_id = ${viewerId}
    order by c.last_message_at desc, c.id desc`
  return rows.map((r) => ({
    id: r.id,
    other: r.other,
    unread: r.unread,
    lastMessage: r.lastBody !== null && r.lastAt ? { body: r.lastBody, senderId: r.lastSenderId!, createdAt: r.lastAt.toISOString() } : null,
  }))
}

/** The conversation if the viewer is a member, otherwise undefined (callers 404). */
export async function getConversation(db: Db, viewerId: string, conversationId: string): Promise<ConversationView | undefined> {
  const [row] = await db<ConversationView[]>`
    select c.id::text as id, ${db.unsafe(authorJson('u'))} as other,
           array(select user_id::text from conversation_members where conversation_id = c.id) as member_ids
    from conversations c
    join conversation_members me on me.conversation_id = c.id and me.user_id = ${viewerId}
    join conversation_members them on them.conversation_id = c.id and them.user_id <> ${viewerId}
    join users u on u.id = them.user_id
    where c.id = ${conversationId}`
  return row
}

/** Messages oldest→newest; `beforeId` pages backwards through history. */
export async function listMessages(db: Db, conversationId: string, beforeId: string | undefined, limit = 50) {
  const rows = await db<(Omit<MessageView, 'createdAt'> & { createdAt: Date })[]>`
    select id::text as id, sender_id::text as sender_id, body, created_at from messages
    where conversation_id = ${conversationId} ${beforeId ? db`and id < ${beforeId}` : db``}
    order by id desc limit ${limit + 1}`
  const page = rows.slice(0, limit)
  return {
    items: page.reverse().map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    olderCursor: rows.length > limit ? page[0]!.id : null,
  }
}

export async function sendMessage(sql: Sql, viewerId: string, conversationId: string, body: string) {
  return sql.begin(async (tx) => {
    const members = await tx<{ userId: string }[]>`
      select user_id::text as user_id from conversation_members where conversation_id = ${conversationId}`
    if (!members.some((m) => m.userId === viewerId)) return 'not_member' as const
    const [message] = await tx<(Omit<MessageView, 'createdAt'> & { createdAt: Date })[]>`
      insert into messages (conversation_id, sender_id, body) values (${conversationId}, ${viewerId}, ${body})
      returning id::text as id, sender_id::text as sender_id, body, created_at`
    await tx`update conversations set last_message_at = ${message!.createdAt} where id = ${conversationId}`
    await tx`update conversation_members set last_read_at = ${message!.createdAt} where conversation_id = ${conversationId} and user_id = ${viewerId}`
    return {
      message: { ...message!, createdAt: message!.createdAt.toISOString() } satisfies MessageView,
      memberIds: members.map((m) => m.userId),
    }
  })
}

export async function getOrCreateDm(sql: Sql, viewerId: string, otherHandle: string) {
  const [other] = await sql<{ id: string }[]>`select id::text as id from users where lower(handle) = lower(${otherHandle})`
  if (!other) return 'missing' as const
  if (other.id === viewerId) return 'self' as const
  const [low, high] = [viewerId, other.id].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1))
  const dmKey = `${low}:${high}`
  return sql.begin(async (tx) => {
    const [existing] = await tx<{ id: string }[]>`select id::text as id from conversations where dm_key = ${dmKey}`
    if (existing) return existing.id
    const [created] = await tx<{ id: string }[]>`
      insert into conversations (dm_key) values (${dmKey})
      on conflict (dm_key) do update set dm_key = excluded.dm_key
      returning id::text as id`
    await tx`
      insert into conversation_members (conversation_id, user_id)
      values (${created!.id}, ${viewerId}), (${created!.id}, ${other.id}) on conflict do nothing`
    return created!.id
  })
}

export async function markConversationRead(db: Db, viewerId: string, conversationId: string): Promise<boolean> {
  const rows = await db`
    update conversation_members set last_read_at = now()
    where conversation_id = ${conversationId} and user_id = ${viewerId}
      and exists (select 1 from messages m where m.conversation_id = ${conversationId}
                  and m.sender_id <> ${viewerId} and m.created_at > conversation_members.last_read_at)
    returning 1`
  return rows.length > 0
}
