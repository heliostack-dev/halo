'use client'

import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import { Menu, MenuItem, MenuLink, MenuSeparator } from '#/ui/menu.tsx'
import { logoutAction } from '#/features/auth/actions.ts'
import type { Viewer } from '#/server/auth/repo.ts'
import styles from './shell.module.css'

export function AccountMenu({ viewer }: { viewer: Viewer }) {
  return (
    <form action={logoutAction} id="logout-form">
      <Menu
        label="Account"
        align="start"
        triggerClassName={styles.accountTrigger}
        trigger={
          <>
            <Avatar name={viewer.displayName} hue={viewer.avatarHue} size="sm" />
            <span className={styles.accountText}>
              <strong>{viewer.displayName}</strong>
              <span>@{viewer.handle}</span>
            </span>
            <Icon name="more" size={18} className={styles.accountChevron} />
          </>
        }
      >
        <MenuLink icon="user" href={`/${viewer.handle}`}>Your profile</MenuLink>
        <MenuLink icon="palette" href="/settings">Display</MenuLink>
        <MenuSeparator />
        <MenuItem icon="logout" type="submit" form="logout-form">Log out @{viewer.handle}</MenuItem>
      </Menu>
    </form>
  )
}
