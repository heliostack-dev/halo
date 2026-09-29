import type { ReactNode } from 'react'
import styles from './settings.module.css'

export function SettingsSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <h2 id={id} className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </header>
      {children}
    </section>
  )
}
