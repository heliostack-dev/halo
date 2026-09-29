import Link from 'next/link'
import { compactNumber } from '#/lib/time.ts'
import { getTrends } from '../server/trends.ts'
import styles from './explore.module.css'

/** Full trending list. Cached for everyone, so it renders into the static shell. */
export async function TrendList() {
  const trends = await getTrends(20)
  if (trends.length === 0) return <p className={styles.empty}>Nothing is trending yet. Post something with a #hashtag.</p>
  return (
    <ol role="list" className={styles.trends}>
      {trends.map((t, i) => (
        <li key={t.tag}>
          <Link href={`/hashtag/${encodeURIComponent(t.tag)}`} className={styles.trend}>
            <span className={styles.rank}>{i + 1}</span>
            <span className={styles.tag}>#{t.tag}</span>
            <span className={styles.count} aria-label={`${t.posts} posts in the last 48 hours`}>{compactNumber(t.posts)} posts</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
