import Link from 'next/link'
import { segment } from '#/lib/text.ts'
import styles from './post-card.module.css'

export function PostText({ body, className }: { body: string; className?: string }) {
  return (
    <p className={className ?? styles.body}>
      {segment(body).map((s, i) => {
        switch (s.type) {
          case 'mention':
            return <Link key={i} href={`/${s.handle}`} className={styles.token}>{s.value}</Link>
          case 'hashtag':
            return <Link key={i} href={`/hashtag/${encodeURIComponent(s.tag)}`} className={styles.token}>{s.value}</Link>
          case 'url':
            return <a key={i} href={s.href} target="_blank" rel="noopener noreferrer nofollow" className={styles.token}>{s.value.replace(/^https?:\/\//, '')}</a>
          default:
            return s.value
        }
      })}
    </p>
  )
}
