'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { Icon, type IconName } from '#/ui/icon.tsx'
import styles from './shell.module.css'

type NavLinkProps = { href: Route; icon: IconName; label: string; badge?: ReactNode; match?: string }

/**
 * Sidebar link with an active state. The pathname is URL data, so it is read inside a Suspense
 * boundary: the prerendered shell shows every link inactive, the active one lights up on the client.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkView {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  )
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname()
  const active = pathname === props.href || pathname.startsWith(`${props.match ?? props.href}/`)
  return <NavLinkView {...props} active={active} />
}

function NavLinkView({ href, icon, label, badge, active }: NavLinkProps & { active: boolean }) {
  return (
    <Link href={href} className={styles.navLink} aria-current={active ? 'page' : undefined}>
      <span className={styles.navIcon}>
        <Icon name={icon} size={22} />
        {badge}
      </span>
      <span className={styles.navLabel}>{label}</span>
    </Link>
  )
}
