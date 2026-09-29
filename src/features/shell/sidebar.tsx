import type { Route } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import { Icon } from '#/ui/icon.tsx'
import { buttonStyles } from '#/ui/button.tsx'
import { AccountMenu } from './account-menu.tsx'
import { LiveBadge } from './live-badge.tsx'
import { NavLink } from './nav-link.tsx'
import { unreadCounts } from './unread.ts'
import styles from './shell.module.css'

/** Left navigation. The link list is static (in the prerendered shell); per-user bits stream in. */
export function Sidebar() {
  return (
    <header className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <Link href="/home" className={styles.logo} aria-label="Halo home">
          <Icon name="logo" size={28} />
          <span className={styles.logoText}>halo</span>
        </Link>
        <nav aria-label="Primary" className={styles.nav}>
          <NavLink href="/home" icon="home" label="Home" />
          <NavLink href="/explore" icon="search" label="Explore" match="/hashtag" />
          <NavLink href="/notifications" icon="bell" label="Notifications" badge={<Suspense><Unread scope="notifications" /></Suspense>} />
          <NavLink href="/messages" icon="mail" label="Messages" badge={<Suspense><Unread scope="messages" /></Suspense>} />
          <NavLink href="/bookmarks" icon="bookmark" label="Bookmarks" />
          <Suspense>
            <ProfileLink />
          </Suspense>
          <NavLink href="/settings" icon="settings" label="Settings" />
        </nav>
        <Link href="/compose/post" className={buttonStyles({ size: 'lg', className: styles.postButton })} scroll={false}>
          <Icon name="plus" size={20} className={styles.postIcon} />
          <span className={styles.postLabel}>Post</span>
        </Link>
        <div className={styles.account}>
          <Suspense fallback={<div className={styles.accountPlaceholder} />}>
            <Account />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

async function Unread({ scope }: { scope: 'notifications' | 'messages' }) {
  const viewer = await getViewer()
  if (!viewer) return null
  const counts = await unreadCounts(sql, viewer.id)
  return <LiveBadge scope={scope} initial={counts[scope]} />
}

async function ProfileLink() {
  const viewer = await getViewer()
  if (!viewer) return null
  return <NavLink href={`/${viewer.handle}` as Route} icon="user" label="Profile" />
}

async function Account() {
  const viewer = await getViewer()
  // Signed-out visitors get the SignupBanner instead of an account block.
  if (!viewer) return null
  return <AccountMenu viewer={viewer} />
}
