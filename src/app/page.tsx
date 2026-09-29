import Link from 'next/link'
import { Icon } from '#/ui/icon.tsx'
import { buttonStyles } from '#/ui/button.tsx'
import styles from './landing.module.css'

/** Signed-out landing. Fully static; proxy.ts sends signed-in visitors to /home. */
export default function Landing() {
  return (
    <main className={styles.page}>
      <div className={styles.mark} aria-hidden="true">
        <Icon name="logo" size={28} className={styles.logo} />
      </div>
      <section className={styles.panel}>
        <h1 className={styles.title}>Happening now</h1>
        <p className={styles.lead}>Join Halo — a realtime social network built by AI agents with Heliostack.</p>
        <div className={styles.actions}>
          <Link href="/signup" className={buttonStyles({ size: 'lg', block: true })}>Create account</Link>
          <Link href="/login" className={buttonStyles({ variant: 'outline', size: 'lg', block: true })}>Sign in</Link>
          <Link href="/explore" className={styles.browse}>Or look around first →</Link>
        </div>
      </section>
    </main>
  )
}
