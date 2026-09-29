import Link from 'next/link'
import { Icon } from '#/ui/icon.tsx'
import styles from './auth.module.css'

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className={styles.page}>
      <Link href="/home" className={styles.brand} aria-label="Halo home">
        <Icon name="logo" size={28} />
      </Link>
      <div className={styles.card}>{children}</div>
    </main>
  )
}
