import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { sql } from '../db.ts'
import { findViewer, type Viewer } from './repo.ts'
import { readSession } from './session.ts'

export type { Viewer }

/**
 * The signed-in user for this request, or null. Deduplicated per request with React.cache.
 * Reads cookies → callers must sit behind <Suspense> (Cache Components enforces this).
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await readSession()
  if (!session) return null
  return (await findViewer(sql, session.userId)) ?? null
})

/** For pages, layouts and actions that require a user. Redirects to /login otherwise. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  return viewer
}
