import { Skeleton } from '#/ui/skeleton.tsx'
import styles from './messages.module.css'

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading conversations">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.conversation}>
          <Skeleton round width="2.5rem" height="2.5rem" />
          <div className={styles.summary}>
            <Skeleton width="45%" />
            <Skeleton width="80%" />
          </div>
        </div>
      ))}
    </div>
  )
}
