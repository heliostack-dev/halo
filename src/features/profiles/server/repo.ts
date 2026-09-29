import type { Db } from '#/server/sql.ts'

// Profile data access. Pure functions of (db, input): no Next.js imports, fully testable.

/** Public profile: identical for every viewer, so it can be cached and tagged. */
export type Profile = {
  id: string
  handle: string
  displayName: string
  bio: string
  location: string
  website: string
  avatarHue: number
  verified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  createdAt: string
}

export type Relationship = { followedByViewer: boolean; followsViewer: boolean }

export async function findProfile(db: Db, handle: string): Promise<Profile | null> {
  const [row] = await db<(Omit<Profile, 'createdAt'> & { createdAt: Date })[]>`
    select id::text as id, handle, display_name, bio, location, website, avatar_hue, verified,
           followers_count, following_count, posts_count, created_at
    from users where lower(handle) = lower(${handle})`
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null
}

export async function relationship(db: Db, viewerId: string, userId: string): Promise<Relationship> {
  const [row] = await db<Relationship[]>`
    select exists(select 1 from follows where follower_id = ${viewerId} and followee_id = ${userId}) as followed_by_viewer,
           exists(select 1 from follows where follower_id = ${userId} and followee_id = ${viewerId}) as follows_viewer`
  return row ?? { followedByViewer: false, followsViewer: false }
}
