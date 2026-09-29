import { EmptyState } from '#/ui/empty-state.tsx'
import { NotificationList } from '#/features/notifications/components/notification-list.tsx'
import { getNotificationsPage, type NotificationTab } from '#/features/notifications/server/queries.ts'

export async function Inbox({ tab }: { tab: NotificationTab }) {
  const initial = await getNotificationsPage(tab)
  return (
    <NotificationList
      tab={tab}
      initial={initial}
      empty={
        tab === 'mentions' ? (
          <EmptyState title="Nothing to see here — yet">When someone mentions you, replies or quotes your posts, you’ll find it here.</EmptyState>
        ) : (
          <EmptyState title="No notifications yet">Likes, reposts, replies and new followers will show up here.</EmptyState>
        )
      }
    />
  )
}
