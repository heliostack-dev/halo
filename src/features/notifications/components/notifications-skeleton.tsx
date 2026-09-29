import { Skeleton } from '#/ui/skeleton.tsx'
import styles from './notifications.module.css'

export function NotificationsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.row}>
          <Skeleton round width="1.5rem" height="1.5rem" />
          <div className={styles.content}>
            <Skeleton round width="2rem" height="2rem" />
            <Skeleton width="60%" />
            <Skeleton width="85%" />
          </div>
        </div>
      ))}
    </div>
  )
}
