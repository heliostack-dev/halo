import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import { tags } from '#/server/cache-tags.ts'
import { findProfile, relationship, type Profile, type Relationship } from './repo.ts'
import { followList, type UserCard } from './follows.ts'

/**
 * Public profile, the same for every viewer → cached and tagged. Follow/unfollow and posting
 * call updateTag(tags.user(handle)), so counts are fresh for the person who changed them.
 */
export async function getProfile(handle: string): Promise<Profile> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.user(handle))
  const profile = await findProfile(sql, handle)
  if (!profile) notFound()
  return profile
}

/** Viewer ↔ profile relationship. Reads the session, so it is uncached and sits behind Suspense. */
export const getRelationship = cache(async (userId: string): Promise<{ viewerId: string | null } & Relationship> => {
  const viewer = await getViewer()
  if (!viewer) return { viewerId: null, followedByViewer: false, followsViewer: false }
  if (viewer.id === userId) return { viewerId: viewer.id, followedByViewer: false, followsViewer: false }
  return { viewerId: viewer.id, ...(await relationship(sql, viewer.id, userId)) }
})

export async function getFollowList(userId: string, direction: 'followers' | 'following'): Promise<{ viewerId: string | null; users: UserCard[] }> {
  const viewer = await getViewer()
  const page = await followList(sql, viewer?.id ?? null, userId, direction, undefined, 50)
  return { viewerId: viewer?.id ?? null, users: page.items }
}
