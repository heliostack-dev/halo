import { Suspense } from 'react'
import { TabNav } from '#/ui/tab-nav.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { ViewerComposer } from '#/features/posts/components/viewer-composer.tsx'

export default function HomeLayout({ children }: LayoutProps<'/home'>) {
  return (
    <>
      <PageHeader
        title="Home"
        tabs={
          <TabNav
            label="Timelines"
            items={[
              { href: '/home', label: 'For you' },
              { href: '/home/following', label: 'Following' },
            ]}
          />
        }
      />
      <Suspense>
        <ViewerComposer />
      </Suspense>
      {children}
    </>
  )
}
