import Link from 'next/link'
import type { Route } from 'next'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon, type IconName } from '#/ui/icon.tsx'
import { cx } from '#/ui/cx.ts'
import { PostCard } from '#/features/posts/components/post-card.tsx'
import { RelativeTime } from '#/features/posts/components/relative-time.tsx'
import { actorSummary, type NotificationGroup } from '../group.ts'
import styles from './notifications.module.css'

const KIND: Record<'like' | 'repost' | 'follow', { icon: IconName; tone: string; text: string }> = {
  like: { icon: 'heart', tone: styles.like!, text: 'liked your post' },
  repost: { icon: 'repeat', tone: styles.repost!, text: 'reposted your post' },
  follow: { icon: 'user', tone: styles.follow!, text: 'followed you' },
}
const MAX_AVATARS = 6

/** One inbox entry. Conversational kinds render the full post; activity renders a grouped row. */
export function NotificationRow({ group: g }: { group: NotificationGroup }) {
  if (g.card) {
    return (
      <div className={cx(styles.item, !g.read && styles.unread)}>
        <PostCard post={g.card} signedIn />
      </div>
    )
  }
  if (g.kind !== 'like' && g.kind !== 'repost' && g.kind !== 'follow') return null
  const kind = KIND[g.kind]
  const lead = g.actors[0]!
  const { first, rest } = actorSummary(g.actors)
  const href = (g.kind === 'follow' || !g.post ? `/${lead.handle}` : `/${g.post.authorHandle}/status/${g.post.id}`) as Route
  return (
    <article className={cx(styles.item, styles.row, !g.read && styles.unread)}>
      <Link href={href} className={styles.overlay} aria-label={`${first}${rest} ${kind.text}`} />
      <span className={cx(styles.kind, kind.tone)}>
        <Icon name={kind.icon} size={24} filled={g.kind !== 'repost'} />
      </span>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.avatars}>
            {g.actors.slice(0, MAX_AVATARS).map((a) => (
              <Link key={a.id} href={`/${a.handle}` as Route} className={styles.avatar} aria-label={a.displayName} title={a.displayName}>
                <Avatar name={a.displayName} hue={a.avatarHue} size="sm" />
              </Link>
            ))}
          </div>
          <span className={styles.time}><RelativeTime date={g.createdAt} /></span>
        </div>
        <p className={styles.text}>
          <Link href={`/${lead.handle}` as Route} className={styles.actor}>{first}</Link>
          {rest} {kind.text}
        </p>
        {g.post && g.kind !== 'follow' ? <p className={styles.snippet}>{g.post.body}</p> : null}
      </div>
    </article>
  )
}
