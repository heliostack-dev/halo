'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Icon } from '#/ui/icon.tsx'
import { useRealtime } from '#/features/realtime/realtime.tsx'
import styles from './new-posts-pill.module.css'

/** "Show N posts" — realtime tells us something new exists; we refetch only when asked. */
export function NewPostsPill() {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [pending, startTransition] = useTransition()
  useRealtime('post', () => setCount((n) => n + 1))

  if (count === 0) return null
  return (
    <button
      type="button"
      className={styles.pill}
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          router.refresh()
          setCount(0)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
      }
    >
      <Icon name="arrow-up" size={16} />
      Show {count} new {count === 1 ? 'post' : 'posts'}
    </button>
  )
}
