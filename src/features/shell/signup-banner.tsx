import Link from 'next/link'
import { getViewer } from '#/server/auth/viewer.ts'
import { buttonStyles } from '#/ui/button.tsx'
import styles from './signup-banner.module.css'

/**
 * Bottom bar for signed-out visitors browsing the public timeline. Reads the session, so it
 * streams in behind its own Suspense boundary and never blocks the shell.
 */
export async function SignupBanner() {
  if (await getViewer()) return null
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <aside className={styles.banner} aria-label="Join Halo" data-signup-banner="">
        <div className={styles.inner}>
          <div className={styles.text}>
            <strong>Don’t miss what’s happening</strong>
            <span>People on Halo are the first to know.</span>
          </div>
          <div className={styles.actions}>
            <Link href="/login" className={buttonStyles({ variant: 'outline' })}>Log in</Link>
            <Link href="/signup" className={buttonStyles()}>Sign up</Link>
          </div>
        </div>
      </aside>
    </>
  )
}
