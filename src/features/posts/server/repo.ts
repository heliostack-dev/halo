import type { Db, Sql } from '#/server/sql.ts'
import { extractHashtags, extractMentions } from '#/lib/text.ts'
import type { CreatePostInput, Page, PostView, QuotedPostView } from '../types.ts'

// Posts data access. Pure functions of (db, viewer, input): no Next.js imports, fully testable.

type Row = Omit<PostView, 'quote' | 'viewer' | 'repostedBy' | 'replyTo' | 'createdAt'> & {
  createdAt: Date
  quoteOfId: string | null
  replyToId: string | null
  replyToHandle: string | null
  reposterHandle: string | null
  reposterName: string | null
  liked: boolean
  reposted: boolean
  bookmarked: boolean
}

const authorJson = (db: Db, alias: string) =>
  db.unsafe(`json_build_object('id', ${alias}.id::text, 'handle', ${alias}.handle, 'displayName', ${alias}.display_name, 'avatarHue', ${alias}.avatar_hue, 'verified', ${alias}.verified)`)

/**
 * Turn timeline item ids (posts or reposts) into fully-populated PostViews in one round trip,
 * preserving the order of `itemIds`. The single place that knows how a post card is assembled.
 */
export async function hydrate(db: Db, viewerId: string | null, itemIds: string[]): Promise<PostView[]> {
  if (itemIds.length === 0) return []
  const viewer = viewerId ?? '0'
  const rows = await db<Row[]>`
    with items as (select * from unnest(${itemIds}::bigint[]) with ordinality as t(item_id, ord))
    select i.item_id::text as item_id, t.id::text as id, t.body, t.created_at,
           t.like_count, t.repost_count, t.reply_count, t.quote_count,
           t.quote_of_id::text as quote_of_id, t.reply_to_id::text as reply_to_id,
           ${authorJson(db, 'a')} as author,
           (select u.handle from posts rp join users u on u.id = rp.author_id where rp.id = t.reply_to_id) as reply_to_handle,
           case when p.repost_of_id is not null then ru.handle end as reposter_handle,
           case when p.repost_of_id is not null then ru.display_name end as reposter_name,
           exists(select 1 from likes l where l.post_id = t.id and l.user_id = ${viewer}) as liked,
           exists(select 1 from posts r where r.repost_of_id = t.id and r.author_id = ${viewer}) as reposted,
           exists(select 1 from bookmarks b where b.post_id = t.id and b.user_id = ${viewer}) as bookmarked
    from items i
    join posts p on p.id = i.item_id
    join posts t on t.id = coalesce(p.repost_of_id, p.id)
    join users a on a.id = t.author_id
    join users ru on ru.id = p.author_id
    order by i.ord`

  const quoteIds = [...new Set(rows.flatMap((r) => (r.quoteOfId ? [r.quoteOfId] : [])))]
  const quotes = new Map((await quoted(db, quoteIds)).map((q) => [q.id, q]))

  return rows.map((r) => ({
    itemId: r.itemId,
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    author: r.author,
    likeCount: r.likeCount,
    repostCount: r.repostCount,
    replyCount: r.replyCount,
    quoteCount: r.quoteCount,
    replyTo: r.replyToId && r.replyToHandle ? { id: r.replyToId, handle: r.replyToHandle } : null,
    quote: (r.quoteOfId && quotes.get(r.quoteOfId)) || null,
    repostedBy: r.reposterHandle ? { handle: r.reposterHandle, displayName: r.reposterName ?? r.reposterHandle } : null,
    viewer: { liked: r.liked, reposted: r.reposted, bookmarked: r.bookmarked, isAuthor: r.author.id === viewerId },
  }))
}

async function quoted(db: Db, ids: string[]): Promise<QuotedPostView[]> {
  if (ids.length === 0) return []
  const rows = await db<(Omit<QuotedPostView, 'createdAt'> & { createdAt: Date })[]>`
    select p.id::text as id, p.body, p.created_at, ${authorJson(db, 'a')} as author
    from posts p join users a on a.id = p.author_id where p.id = any(${ids}::bigint[])`
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
}

function page(ids: string[], limit: number): Page<string> {
  const items = ids.slice(0, limit)
  return { items, nextCursor: ids.length > limit ? items.at(-1)! : null }
}

// ---------------------------------------------------------------- feeds (return item ids)

/** Chronological home timeline: the viewer and everyone they follow, including reposts. */
export async function followingTimeline(db: Db, viewerId: string, cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string }[]>`
    select p.id::text from posts p
    where p.author_id in (select followee_id from follows where follower_id = ${viewerId} union all select ${viewerId}::bigint)
      and p.reply_to_id is null
      ${cursor ? db`and p.id < ${cursor}` : db``}
    order by p.id desc limit ${limit + 1}`
  return page(rows.map((r) => r.id), limit)
}

/**
 * "For you": recent original posts ranked by engagement decayed by age (Hacker-News style).
 * A ranked feed cannot use an id cursor, so the cursor is an offset. Window: 14 days.
 */
export async function rankedTimeline(db: Db, cursor: string | undefined, limit = 20) {
  const offset = Number(cursor ?? 0)
  const rows = await db<{ id: string }[]>`
    select p.id::text from posts p
    where p.reply_to_id is null and p.repost_of_id is null and p.created_at > now() - interval '14 days'
    order by (1 + p.like_count + 2 * p.repost_count + p.reply_count + 2 * p.quote_count)
             / power(extract(epoch from now() - p.created_at) / 3600 + 2, 1.4) desc, p.id desc
    offset ${offset} limit ${limit + 1}`
  const ids = rows.map((r) => r.id)
  return { items: ids.slice(0, limit), nextCursor: ids.length > limit ? String(offset + limit) : null }
}

export async function userTimeline(db: Db, authorId: string, mode: 'posts' | 'replies', cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string }[]>`
    select p.id::text from posts p
    where p.author_id = ${authorId}
      ${mode === 'posts' ? db`and p.reply_to_id is null` : db``}
      ${cursor ? db`and p.id < ${cursor}` : db``}
    order by p.id desc limit ${limit + 1}`
  return page(rows.map((r) => r.id), limit)
}

/** Posts a user liked, newest like first. Cursor is the like's epoch-ms to keep ordering stable. */
export async function likedBy(db: Db, userId: string, cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string; at: string }[]>`
    select post_id::text as id, (extract(epoch from created_at) * 1000000)::bigint::text as at from likes
    where user_id = ${userId} ${cursor ? db`and created_at < to_timestamp(${Number(cursor) / 1_000_000})` : db``}
    order by created_at desc limit ${limit + 1}`
  const items = rows.slice(0, limit)
  return { items: items.map((r) => r.id), nextCursor: rows.length > limit ? items.at(-1)!.at : null }
}

export async function bookmarkedBy(db: Db, userId: string, cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string; at: string }[]>`
    select post_id::text as id, (extract(epoch from created_at) * 1000000)::bigint::text as at from bookmarks
    where user_id = ${userId} ${cursor ? db`and created_at < to_timestamp(${Number(cursor) / 1_000_000})` : db``}
    order by created_at desc limit ${limit + 1}`
  const items = rows.slice(0, limit)
  return { items: items.map((r) => r.id), nextCursor: rows.length > limit ? items.at(-1)!.at : null }
}

export async function hashtagTimeline(db: Db, tag: string, cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string }[]>`
    select post_id::text as id from post_hashtags
    where tag = ${tag.toLowerCase()} ${cursor ? db`and post_id < ${cursor}` : db``}
    order by post_id desc limit ${limit + 1}`
  return page(rows.map((r) => r.id), limit)
}

export async function searchPosts(db: Db, query: string, cursor: string | undefined, limit = 20) {
  const rows = await db<{ id: string }[]>`
    select p.id::text from posts p
    where p.search @@ websearch_to_tsquery('simple', ${query}) and p.repost_of_id is null
      ${cursor ? db`and p.id < ${cursor}` : db``}
    order by p.id desc limit ${limit + 1}`
  return page(rows.map((r) => r.id), limit)
}

/** New posts in the viewer's home timeline since `sinceId` (for the "Show N posts" pill). */
export async function countNewSince(db: Db, viewerId: string, sinceId: string) {
  const [row] = await db<{ n: number }[]>`
    select count(*)::int as n from posts p
    where p.id > ${sinceId} and p.reply_to_id is null and p.author_id <> ${viewerId}
      and p.author_id in (select followee_id from follows where follower_id = ${viewerId})`
  return row?.n ?? 0
}

// ---------------------------------------------------------------- threads

export async function ancestors(db: Db, postId: string): Promise<string[]> {
  const rows = await db<{ id: string }[]>`
    with recursive up as (
      select reply_to_id as id, 1 as depth from posts where id = ${postId}
      union all
      select p.reply_to_id, up.depth + 1 from posts p join up on p.id = up.id where up.depth < 50
    )
    select id::text from up where id is not null order by depth desc`
  return rows.map((r) => r.id)
}

/** Direct replies, most-liked first, then oldest. Offset cursor because the order is ranked. */
export async function replies(db: Db, postId: string, cursor: string | undefined, limit = 30) {
  const offset = Number(cursor ?? 0)
  const rows = await db<{ id: string }[]>`
    select id::text from posts where reply_to_id = ${postId}
    order by like_count desc, id asc offset ${offset} limit ${limit + 1}`
  const ids = rows.map((r) => r.id)
  return { items: ids.slice(0, limit), nextCursor: ids.length > limit ? String(offset + limit) : null }
}

export async function postExists(db: Db, postId: string) {
  const [row] = await db<{ authorId: string; handle: string; repostOfId: string | null }[]>`
    select p.author_id::text as author_id, u.handle, p.repost_of_id::text as repost_of_id
    from posts p join users u on u.id = p.author_id where p.id = ${postId}`
  return row
}

// ---------------------------------------------------------------- mutations

export type Notify = { recipientId: string; kind: 'like' | 'repost' | 'reply' | 'quote' | 'mention' | 'follow'; postId?: string }

async function notify(db: Db, actorId: string, list: Notify[]): Promise<Notify[]> {
  const targets = list.filter((n) => n.recipientId !== actorId)
  for (const n of targets) {
    await db`
      insert into notifications (recipient_id, actor_id, kind, post_id)
      values (${n.recipientId}, ${actorId}, ${n.kind}, ${n.postId ?? null})
      on conflict (recipient_id, actor_id, kind, coalesce(post_id, 0))
      do update set created_at = now(), read_at = null`
  }
  return targets
}

export type CreatedPost = { id: string; authorHandle: string; notified: Notify[] }

export async function createPost(sql: Sql, authorId: string, input: CreatePostInput): Promise<CreatedPost | 'parent_missing'> {
  return sql.begin(async (tx) => {
    let rootId: string | null = null
    let parentAuthor: string | null = null
    if (input.replyToId) {
      const [parent] = await tx<{ authorId: string; rootId: string | null; repostOfId: string | null }[]>`
        select author_id::text, root_id::text, repost_of_id::text from posts where id = ${input.replyToId}`
      if (!parent || parent.repostOfId) return 'parent_missing'
      rootId = parent.rootId ?? input.replyToId
      parentAuthor = parent.authorId
    }
    let quotedAuthor: string | null = null
    if (input.quoteOfId) {
      const [q] = await tx<{ authorId: string }[]>`select author_id::text from posts where id = ${input.quoteOfId} and repost_of_id is null`
      if (!q) return 'parent_missing'
      quotedAuthor = q.authorId
    }

    const [post] = await tx<{ id: string; handle: string }[]>`
      insert into posts (author_id, body, reply_to_id, root_id, quote_of_id)
      values (${authorId}, ${input.body}, ${input.replyToId ?? null}, ${rootId}, ${input.quoteOfId ?? null})
      returning id::text, (select handle from users where id = ${authorId}) as handle`
    const id = post!.id

    const tags = extractHashtags(input.body)
    if (tags.length) await tx`insert into post_hashtags ${tx(tags.map((tag) => ({ postId: id, tag })))} on conflict do nothing`

    const handles = extractMentions(input.body)
    const mentioned = handles.length
      ? await tx<{ id: string }[]>`select id::text from users where lower(handle) = any(${handles})`
      : []
    if (mentioned.length) await tx`insert into post_mentions ${tx(mentioned.map((u) => ({ postId: id, userId: u.id })))} on conflict do nothing`

    const notified = await notify(tx, authorId, [
      ...(parentAuthor ? [{ recipientId: parentAuthor, kind: 'reply' as const, postId: id }] : []),
      ...(quotedAuthor ? [{ recipientId: quotedAuthor, kind: 'quote' as const, postId: id }] : []),
      ...mentioned.filter((u) => u.id !== parentAuthor).map((u) => ({ recipientId: u.id, kind: 'mention' as const, postId: id })),
    ])
    return { id, authorHandle: post!.handle, notified }
  })
}

export async function deletePost(db: Db, viewerId: string, postId: string): Promise<boolean> {
  const rows = await db`delete from posts where id = ${postId} and author_id = ${viewerId} and repost_of_id is null returning id`
  return rows.length > 0
}

export async function setLike(sql: Sql, viewerId: string, postId: string, on: boolean): Promise<Notify[]> {
  return sql.begin(async (tx) => {
    if (!on) {
      await tx`delete from likes where user_id = ${viewerId} and post_id = ${postId}`
      return []
    }
    const inserted = await tx`insert into likes (user_id, post_id) values (${viewerId}, ${postId}) on conflict do nothing returning post_id`
    if (!inserted.length) return []
    const [p] = await tx<{ authorId: string }[]>`select author_id::text from posts where id = ${postId}`
    return p ? notify(tx, viewerId, [{ recipientId: p.authorId, kind: 'like', postId }]) : []
  })
}

export async function setRepost(sql: Sql, viewerId: string, postId: string, on: boolean): Promise<Notify[]> {
  return sql.begin(async (tx) => {
    if (!on) {
      await tx`delete from posts where author_id = ${viewerId} and repost_of_id = ${postId}`
      return []
    }
    const [target] = await tx<{ authorId: string }[]>`select author_id::text from posts where id = ${postId} and repost_of_id is null`
    if (!target) return []
    const inserted = await tx`
      insert into posts (author_id, repost_of_id) values (${viewerId}, ${postId})
      on conflict (author_id, repost_of_id) where repost_of_id is not null do nothing returning id`
    return inserted.length ? notify(tx, viewerId, [{ recipientId: target.authorId, kind: 'repost', postId }]) : []
  })
}

export async function setBookmark(db: Db, viewerId: string, postId: string, on: boolean) {
  if (on) await db`insert into bookmarks (user_id, post_id) values (${viewerId}, ${postId}) on conflict do nothing`
  else await db`delete from bookmarks where user_id = ${viewerId} and post_id = ${postId}`
}
