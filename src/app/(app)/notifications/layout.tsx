import { TabNav } from '#/ui/tab-nav.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { InboxLive } from '#/features/notifications/components/inbox-live.tsx'

export default function NotificationsLayout({ children }: LayoutProps<'/notifications'>) {
  return (
    <>
      <PageHeader
        title="Notifications"
        tabs={
          <TabNav
            label="Notification filters"
            items={[
              { href: '/notifications', label: 'All' },
              { href: '/notifications/mentions', label: 'Mentions' },
            ]}
          />
        }
      />
      <InboxLive />
      {children}
    </>
  )
}
