import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NotificationsSkeleton } from '#/features/notifications/components/notifications-skeleton.tsx'
import { Inbox } from '#/features/notifications/components/inbox.tsx'

export const metadata: Metadata = { title: 'Mentions' }

export default function MentionsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <Inbox tab="mentions" />
    </Suspense>
  )
}
