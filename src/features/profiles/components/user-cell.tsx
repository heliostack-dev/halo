import Link from 'next/link'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import type { UserCard } from '../server/follows.ts'
import { FollowButton } from './follow-button.tsx'
import styles from './user-cell.module.css'

/** A user row. `compact` is for narrow rails: tighter padding, no bio, no "Follows you" chip. */
export function UserCell({ user, viewerId, showBio = true, compact = false }: { user: UserCard; viewerId: string | null; showBio?: boolean; compact?: boolean }) {
  return (
    <div className={compact ? `${styles.cell} ${styles.compact}` : styles.cell}>
      <Link href={`/${user.handle}`} className={styles.overlay} aria-label={user.displayName} />
      <Avatar name={user.displayName} hue={user.avatarHue} />
      <div className={styles.text}>
        <div className={styles.top}>
          <div className={styles.names}>
            <span className={styles.name}>
              {user.displayName}
              {user.verified ? <Icon name="verified" size={16} label="Verified" className={styles.verified} /> : null}
            </span>
            <span className={styles.handle}>
              @{user.handle}
              {user.followsViewer && !compact ? <span className={styles.chip}>Follows you</span> : null}
            </span>
          </div>
          {viewerId !== user.id ? (
            <div className={styles.action}>
              <FollowButton userId={user.id} handle={user.handle} following={user.followedByViewer} signedIn={viewerId !== null} />
            </div>
          ) : null}
        </div>
        {showBio && !compact && user.bio ? <p className={styles.bio}>{user.bio}</p> : null}
      </div>
    </div>
  )
}
