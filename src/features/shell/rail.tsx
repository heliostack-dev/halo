import Link from 'next/link'
import { Suspense } from 'react'
import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import { Icon } from '#/ui/icon.tsx'
import { Skeleton } from '#/ui/skeleton.tsx'
import { getTrends } from '#/features/explore/server/trends.ts'
import { suggestions } from '#/features/profiles/server/follows.ts'
import { UserCell } from '#/features/profiles/components/user-cell.tsx'
import { compactNumber } from '#/lib/time.ts'
import styles from './shell.module.css'

export function Rail() {
  return (
    <aside className={styles.rail} aria-label="Discover">
      <form action="/explore" role="search" className={styles.search}>
        <Icon name="search" size={18} />
        <label htmlFor="rail-search" className="visually-hidden">Search Halo</label>
        <input id="rail-search" name="q" type="search" placeholder="Search" autoComplete="off" />
      </form>
      <section className={styles.panel} aria-labelledby="trends-title">
        <h2 id="trends-title" className={styles.panelTitle}>Trending now</h2>
        <Trends />
      </section>
      <section className={styles.panel} aria-labelledby="wtf-title">
        <h2 id="wtf-title" className={styles.panelTitle}>Who to follow</h2>
        <Suspense fallback={<RailSkeleton />}>
          <WhoToFollow />
        </Suspense>
      </section>
      <footer className={styles.footer}>Built with Heliostack · Next.js 16 · React 19.3</footer>
    </aside>
  )
}

/** Cached for everyone → part of the prerendered shell, no Suspense needed. */
async function Trends() {
  const trends = await getTrends()
  if (trends.length === 0) return <p className={styles.panelEmpty}>Nothing trending yet.</p>
  return (
    <ol className={styles.trends} role="list">
      {trends.map((t) => (
        <li key={t.tag}>
          <Link href={`/hashtag/${encodeURIComponent(t.tag)}`} className={styles.trend}>
            <span className={styles.trendTag}>#{t.tag}</span>
            <span className={styles.trendCount} aria-label={`${t.posts} posts`}>{compactNumber(t.posts)}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** Personalised → streams in behind Suspense. */
async function WhoToFollow() {
  const viewer = await getViewer()
  const users = await suggestions(sql, viewer?.id ?? null)
  return (
    <div className={styles.suggestions}>
      {users.map((u) => (
        <UserCell key={u.id} user={u} viewerId={viewer?.id ?? null} compact />
      ))}
    </div>
  )
}

function RailSkeleton() {
  return (
    <div className={styles.skeleton}>
      <Skeleton height="2.5rem" />
      <Skeleton height="2.5rem" />
      <Skeleton height="2.5rem" />
    </div>
  )
}
