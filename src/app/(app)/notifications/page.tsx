import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NotificationsSkeleton } from '#/features/notifications/components/notifications-skeleton.tsx'
import { Inbox } from '#/features/notifications/components/inbox.tsx'

export const metadata: Metadata = { title: 'Notifications' }

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <Inbox tab="all" />
    </Suspense>
  )
}
