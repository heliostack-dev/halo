'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '#/ui/icon.tsx'
import styles from './shell.module.css'

export function NavLink({ href, icon, label, badge, match }: { href: Route; icon: IconName; label: string; badge?: ReactNode; match?: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${match ?? href}/`)
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
