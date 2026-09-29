import 'server-only'
import type { Db } from '#/server/sql.ts'

export async function unreadCounts(db: Db, viewerId: string) {
  const [row] = await db<{ notifications: number; messages: number }[]>`
    select
      (select count(*)::int from notifications where recipient_id = ${viewerId} and read_at is null) as notifications,
      (select count(*)::int from conversation_members cm join conversations c on c.id = cm.conversation_id
        where cm.user_id = ${viewerId} and c.last_message_at > cm.last_read_at
          and exists (select 1 from messages m where m.conversation_id = c.id and m.sender_id <> ${viewerId} and m.created_at > cm.last_read_at)
      ) as messages`
  return row ?? { notifications: 0, messages: 0 }
}
