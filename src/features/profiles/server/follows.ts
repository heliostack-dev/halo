import type { Db, Sql } from '#/server/sql.ts'
import type { AuthorView } from '#/features/posts/types.ts'

export type UserCard = AuthorView & { bio: string; followedByViewer: boolean; followsViewer: boolean }

export async function setFollow(sql: Sql, followerId: string, followeeId: string, on: boolean): Promise<'ok' | 'self' | 'missing' | 'noop'> {
  if (followerId === followeeId) return 'self'
  return sql.begin(async (tx) => {
    const [target] = await tx`select 1 from users where id = ${followeeId}`
    if (!target) return 'missing'
    if (!on) {
      const removed = await tx`delete from follows where follower_id = ${followerId} and followee_id = ${followeeId} returning 1`
      return removed.length ? 'ok' : 'noop'
    }
    const added = await tx`insert into follows (follower_id, followee_id) values (${followerId}, ${followeeId}) on conflict do nothing returning 1`
    if (!added.length) return 'noop'
    await tx`
      insert into notifications (recipient_id, actor_id, kind) values (${followeeId}, ${followerId}, 'follow')
      on conflict (recipient_id, actor_id, kind, coalesce(post_id, 0)) do update set created_at = now(), read_at = null`
    return 'ok'
  })
}

const cardColumns = (db: Db, viewerId: string | null) => db`
  u.id::text as id, u.handle, u.display_name, u.avatar_hue, u.verified, u.bio,
  exists(select 1 from follows f where f.follower_id = ${viewerId ?? '0'} and f.followee_id = u.id) as followed_by_viewer,
  exists(select 1 from follows f where f.follower_id = u.id and f.followee_id = ${viewerId ?? '0'}) as follows_viewer`

/** Popular accounts the viewer doesn't follow yet. */
export async function suggestions(db: Db, viewerId: string | null, limit = 3): Promise<UserCard[]> {
  return db<UserCard[]>`
    select ${cardColumns(db, viewerId)} from users u
    where u.id <> ${viewerId ?? '0'}
      and not exists (select 1 from follows f where f.follower_id = ${viewerId ?? '0'} and f.followee_id = u.id)
    order by u.followers_count desc, u.id limit ${limit}`
}

export async function followList(db: Db, viewerId: string | null, userId: string, direction: 'followers' | 'following', cursor: string | undefined, limit = 30) {
  const rows = await db<(UserCard & { at: string })[]>`
    select ${cardColumns(db, viewerId)}, (extract(epoch from f.created_at) * 1000000)::bigint::text as at
    from follows f join users u on u.id = ${direction === 'followers' ? db`f.follower_id` : db`f.followee_id`}
    where ${direction === 'followers' ? db`f.followee_id` : db`f.follower_id`} = ${userId}
      ${cursor ? db`and f.created_at < to_timestamp(${Number(cursor) / 1_000_000})` : db``}
    order by f.created_at desc limit ${limit + 1}`
  const items = rows.slice(0, limit)
  return { items, nextCursor: rows.length > limit ? items.at(-1)!.at : null }
}

export async function searchUsers(db: Db, viewerId: string | null, query: string, limit = 20): Promise<UserCard[]> {
  const q = query.replace(/^@/, '').toLowerCase().replace(/[%_\\]/g, (c) => `\\${c}`)
  return db<UserCard[]>`
    select ${cardColumns(db, viewerId)} from users u
    where lower(u.handle) like ${q + '%'} or lower(u.display_name) like ${q + '%'} or lower(u.display_name) like ${'% ' + q + '%'}
    order by (lower(u.handle) = ${q}) desc, u.followers_count desc limit ${limit}`
}
