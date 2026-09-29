'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useOptimistic, useState } from 'react'
import { Button } from '#/ui/button.tsx'
import { useToast } from '#/ui/toast.tsx'
import { setFollowAction } from '../actions.ts'
import styles from './follow-button.module.css'

export function FollowButton({ userId, handle, following, signedIn, size = 'sm' }: {
  userId: string
  handle: string
  following: boolean
  signedIn: boolean
  size?: 'sm' | 'md'
}) {
  const router = useRouter()
  const toast = useToast()
  const [confirmed, setConfirmed] = useState(following)
  const [shown, setShown] = useOptimistic(confirmed)

  function toggle() {
    if (!signedIn) return router.push('/login')
    const next = !shown
    startTransition(async () => {
      setShown(next)
      const result = await setFollowAction(userId, handle, next)
      if (result.status === 'success') startTransition(() => setConfirmed(next))
      else toast(result.status === 'error' ? (result.formError ?? 'Something went wrong') : 'Something went wrong', { tone: 'danger' })
    })
  }

  return shown ? (
    <Button variant="outline" size={size} onClick={toggle} className={styles.following} aria-label={`Unfollow @${handle}`}>
      <span className={styles.idle}>Following</span>
      <span className={styles.hover} aria-hidden="true">Unfollow</span>
    </Button>
  ) : (
    <Button variant="inverted" size={size} onClick={toggle} aria-label={`Follow @${handle}`}>
      Follow
    </Button>
  )
}
