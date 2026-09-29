import { Skeleton } from '#/ui/skeleton.tsx'
import styles from './feed-skeleton.module.css'

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.item}>
          <Skeleton round width="2.5rem" height="2.5rem" />
          <div className={styles.lines}>
            <Skeleton width="40%" />
            <Skeleton width="95%" />
            <Skeleton width="70%" />
          </div>
        </div>
      ))}
    </div>
  )
}
