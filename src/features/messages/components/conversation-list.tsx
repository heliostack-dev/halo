import Link from 'next/link'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import { cx } from '#/ui/cx.ts'
import { EmptyState } from '#/ui/empty-state.tsx'
import { RelativeTime } from '#/features/posts/components/relative-time.tsx'
import { getInbox } from '../server/queries.ts'
import styles from './messages.module.css'

export async function ConversationList() {
  const { viewer, conversations } = await getInbox()
  if (conversations.length === 0) {
    return (
      <EmptyState title="Welcome to your inbox">
        Start a conversation from someone’s profile, or from the menu on any of their posts.
      </EmptyState>
    )
  }
  return (
    <ul role="list" className={styles.list}>
      {conversations.map((c) => (
        <li key={c.id}>
          <Link href={`/messages/${c.id}`} className={cx(styles.conversation, c.unread && styles.unread)} prefetch>
            <Avatar name={c.other.displayName} hue={c.other.avatarHue} />
            <div className={styles.summary}>
              <div className={styles.summaryTop}>
                <span className={styles.name}>
                  {c.other.displayName}
                  {c.other.verified ? <Icon name="verified" size={16} label="Verified" className={styles.verified} /> : null}
                </span>
                <span className={styles.meta}>
                  <span className={styles.handle}>@{c.other.handle}</span>
                  {c.lastMessage ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <RelativeTime date={c.lastMessage.createdAt} />
                    </>
                  ) : null}
                </span>
              </div>
              <p className={styles.preview}>
                {c.lastMessage ? `${c.lastMessage.senderId === viewer.id ? 'You: ' : ''}${c.lastMessage.body}` : 'No messages yet'}
              </p>
            </div>
            {c.unread ? <span className={styles.dot} aria-label="Unread" /> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
