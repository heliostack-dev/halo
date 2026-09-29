import Link from 'next/link'
import { Icon } from '#/ui/icon.tsx'
import type { AuthorView } from '../types.ts'
import { RelativeTime } from './relative-time.tsx'
import styles from './post-card.module.css'

export function AuthorLine({ author, createdAt, href }: { author: AuthorView; createdAt: string; href?: string }) {
  return (
    <div className={styles.authorLine}>
      <Link href={`/${author.handle}`} className={styles.name}>
        <span className={styles.displayName}>{author.displayName}</span>
        {author.verified ? <Icon name="verified" size={16} label="Verified" className={styles.verified} /> : null}
      </Link>
      <span className={styles.meta}>
        <span className={styles.handle}>@{author.handle}</span>
        <span aria-hidden="true">·</span>
        {href ? (
          <Link href={href as never} className={styles.time}><RelativeTime date={createdAt} /></Link>
        ) : (
          <RelativeTime date={createdAt} />
        )}
      </span>
    </div>
  )
}
