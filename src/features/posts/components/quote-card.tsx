import Link from 'next/link'
import { Avatar } from '#/ui/avatar.tsx'
import type { QuotedPostView } from '../types.ts'
import { AuthorLine } from './author-line.tsx'
import { PostText } from './post-text.tsx'
import styles from './post-card.module.css'

export function QuoteCard({ post }: { post: QuotedPostView }) {
  return (
    <div className={styles.quote}>
      <Link href={`/${post.author.handle}/status/${post.id}`} className={styles.overlay} aria-label={`Quoted post by ${post.author.displayName}`} />
      <div className={styles.quoteHeader}>
        <Avatar name={post.author.displayName} hue={post.author.avatarHue} size="xs" />
        <AuthorLine author={post.author} createdAt={post.createdAt} />
      </div>
      <PostText body={post.body} className={styles.quoteBody} />
    </div>
  )
}
