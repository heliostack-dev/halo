import { Suspense } from 'react'
import { RealtimeProvider } from '#/features/realtime/realtime.tsx'
import { SignupBanner } from '#/features/shell/signup-banner.tsx'
import { Sidebar } from '#/features/shell/sidebar.tsx'
import { Rail } from '#/features/shell/rail.tsx'
import styles from '#/features/shell/shell.module.css'

/**
 * Three-column shell. Nothing here awaits request data, so the whole frame is part of the
 * prerendered static shell and page-to-page navigations are instant. Per-user fragments
 * (account, unread badges, suggestions) stream in behind their own Suspense boundaries.
 */
export default function AppLayout({ children, modal }: LayoutProps<'/'>) {
  return (
    <RealtimeProvider>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
        <Rail />
      </div>
      {modal}
      <Suspense>
        <SignupBanner />
      </Suspense>
    </RealtimeProvider>
  )
}
