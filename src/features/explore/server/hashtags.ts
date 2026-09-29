import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { sql } from '#/server/db.ts'
import { tags } from '#/server/cache-tags.ts'

/** Normalise a URL segment into a stored hashtag: lower-case, no leading '#'. Null if invalid. */
export function normalizeTag(raw: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const tag = decoded.replace(/^#/, '').trim().toLowerCase()
  return /^[\p{L}\p{N}_]{1,50}$/u.test(tag) ? tag : null
}

/** All-time post count for a hashtag. Shared by everyone, so cached with the trends tag. */
export async function getHashtagCount(tag: string): Promise<number> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.trends())
  const [row] = await sql<{ n: number }[]>`select count(*)::int as n from post_hashtags where tag = ${tag}`
  return row?.n ?? 0
}
