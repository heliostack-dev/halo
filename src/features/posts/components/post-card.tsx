import Link from 'next/link'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import { cx } from '#/ui/cx.ts'
import type { PostView } from '../types.ts'
import { AuthorLine } from './author-line.tsx'
import { PostActions } from './post-actions.tsx'
import { PostMenu } from './post-menu.tsx'
import { PostText } from './post-text.tsx'
import { QuoteCard } from './quote-card.tsx'
import styles from './post-card.module.css'

/**
 * A post in a list. Shared component: renders on the server for the first page and on the client
 * for pages loaded by infinite scroll. The whole card is a link via an overlay anchor, so nested
 * links and buttons stay valid HTML.
 */
export function PostCard({ post, signedIn, threadLine }: { post: PostView; signedIn: boolean; threadLine?: boolean }) {
  const href = `/${post.author.handle}/status/${post.id}`
  return (
    <article className={cx(styles.card, threadLine && styles.threaded)} aria-labelledby={`post-${post.itemId}`}>
      <Link href={href as never} className={styles.overlay} aria-hidden="true" tabIndex={-1} />
      {post.repostedBy ? (
        <div className={styles.context}>
          <Icon name="repeat" size={16} />
          <Link href={`/${post.repostedBy.handle}`}>{post.repostedBy.displayName} reposted</Link>
        </div>
      ) : null}
      <div className={styles.row}>
        <Link href={`/${post.author.handle}`} className={styles.avatar} aria-label={post.author.displayName}>
          <Avatar name={post.author.displayName} hue={post.author.avatarHue} />
        </Link>
        <div className={styles.main}>
          <div className={styles.header} id={`post-${post.itemId}`}>
            <AuthorLine author={post.author} createdAt={post.createdAt} href={href} />
            <PostMenu post={post} signedIn={signedIn} />
          </div>
          {post.replyTo ? (
            <p className={styles.replying}>
              Replying to <Link href={`/${post.replyTo.handle}`}>@{post.replyTo.handle}</Link>
            </p>
          ) : null}
          <PostText body={post.body} />
          {post.quote ? <QuoteCard post={post.quote} /> : null}
          <PostActions post={post} signedIn={signedIn} />
        </div>
      </div>
    </article>
  )
}
