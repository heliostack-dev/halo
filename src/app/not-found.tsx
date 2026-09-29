import Link from 'next/link'
import { Icon } from '#/ui/icon.tsx'
import { buttonStyles } from '#/ui/button.tsx'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Icon name="logo" size={28} className={styles.logo} />
      <h1 className={styles.title}>This page doesn’t exist</h1>
      <p className={styles.body}>The link may be broken, or the post or account may have been removed.</p>
      <Link href="/home" className={buttonStyles()}>Go home</Link>
    </main>
  )
}
