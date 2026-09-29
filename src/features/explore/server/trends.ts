import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { sql } from '#/server/db.ts'
import { tags } from '#/server/cache-tags.ts'

export type Trend = { tag: string; posts: number }

/**
 * Hashtags by use in the last 48 hours. Same for everyone, so it is cached (and prerendered into
 * the static shell); a few minutes of staleness is fine for trends.
 */
export async function getTrends(limit = 6): Promise<Trend[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.trends())
  return sql<Trend[]>`
    select tag, count(*)::int as posts from post_hashtags
    where created_at > now() - interval '48 hours'
    group by tag order by count(*) desc, tag limit ${limit}`
}
