import type { ReactNode } from 'react'
import { BackButton } from './back-button.tsx'
import styles from './shell.module.css'

/**
 * Sticky page chrome: a 60px title bar plus optional tabs underneath, on one blurred surface.
 * Every page uses it, so titles, back buttons and tabs line up everywhere.
 */
export function PageHeader({ title, subtitle, back, actions, tabs }: {
  title: ReactNode
  subtitle?: ReactNode
  back?: boolean
  actions?: ReactNode
  tabs?: ReactNode
}) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageBar}>
        {back ? <BackButton /> : null}
        <h1 className={styles.pageTitle}>
          {title}
          {subtitle ? <small>{subtitle}</small> : null}
        </h1>
        {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      </div>
      {tabs}
    </div>
  )
}
