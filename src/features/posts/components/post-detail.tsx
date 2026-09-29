import Link from 'next/link'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import { compactNumber, fullDate } from '#/lib/time.ts'
import type { PostView } from '../types.ts'
import { PostActions } from './post-actions.tsx'
import { PostMenu } from './post-menu.tsx'
import { PostText } from './post-text.tsx'
import { QuoteCard } from './quote-card.tsx'
import { PostDetailAnchor } from './post-detail-anchor.tsx'
import styles from './post-detail.module.css'

/** The focused post on a thread page: larger type, full timestamp, stats, then the actions. */
export function PostDetail({ post, signedIn, hasAncestors }: { post: PostView; signedIn: boolean; hasAncestors: boolean }) {
  const stats = [
    { n: post.repostCount, one: 'Repost', many: 'Reposts' },
    { n: post.quoteCount, one: 'Quote', many: 'Quotes' },
    { n: post.likeCount, one: 'Like', many: 'Likes' },
  ].filter((s) => s.n > 0)

  return (
    <article id="focused-post" className={styles.detail} aria-labelledby="focused-post-author">
      {hasAncestors ? <PostDetailAnchor /> : null}
      <header className={styles.header}>
        <Link href={`/${post.author.handle}`} aria-label={post.author.displayName} className={styles.avatar}>
          <Avatar name={post.author.displayName} hue={post.author.avatarHue} />
        </Link>
        <div className={styles.who} id="focused-post-author">
          <Link href={`/${post.author.handle}`} className={styles.name}>
            <span className={styles.displayName}>{post.author.displayName}</span>
            {post.author.verified ? <Icon name="verified" size={16} label="Verified" className={styles.verified} /> : null}
          </Link>
          <span className={styles.handle}>@{post.author.handle}</span>
        </div>
        <div className={styles.menu}>
          <PostMenu post={post} signedIn={signedIn} />
        </div>
      </header>

      {post.replyTo ? (
        <p className={styles.replying}>
          Replying to <Link href={`/${post.replyTo.handle}`}>@{post.replyTo.handle}</Link>
        </p>
      ) : null}
      <PostText body={post.body} className={styles.body} />
      {post.quote ? <QuoteCard post={post.quote} /> : null}

      <p className={styles.date}>
        <time dateTime={post.createdAt}>{fullDate(post.createdAt)}</time>
      </p>

      {stats.length ? (
        <p className={styles.stats}>
          {stats.map((s) => (
            <span key={s.one}>
              <strong>{compactNumber(s.n)}</strong> {s.n === 1 ? s.one : s.many}
            </span>
          ))}
        </p>
      ) : null}

      <div className={styles.actions}>
        <PostActions post={post} signedIn={signedIn} />
      </div>
    </article>
  )
}
