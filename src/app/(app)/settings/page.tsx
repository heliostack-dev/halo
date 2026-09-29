import type { Metadata } from 'next'
import { Suspense } from 'react'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { Button } from '#/ui/button.tsx'
import { Skeleton } from '#/ui/skeleton.tsx'
import { ThemePicker } from '#/ui/theme-picker.tsx'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { logoutAction } from '#/features/auth/actions.ts'
import { ProfileForm } from '#/features/settings/components/profile-form.tsx'
import { SettingsSection } from '#/features/settings/components/settings-section.tsx'
import { getEditableProfile } from '#/features/settings/server/repo.ts'
import styles from '#/features/settings/components/settings.module.css'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className={styles.page}>
        <SettingsSection id="settings-display" title="Display" description="Colour theme and appearance. Saved on this device.">
          <ThemePicker />
        </SettingsSection>
        <SettingsSection id="settings-profile" title="Profile" description="How you appear on your profile and next to your posts.">
          <Suspense fallback={<FormSkeleton />}>
            <Profile />
          </Suspense>
        </SettingsSection>
        <SettingsSection id="settings-account" title="Account" description="Signed-in session on this browser.">
          <Suspense fallback={<Skeleton height="2.75rem" />}>
            <Account />
          </Suspense>
        </SettingsSection>
      </div>
    </>
  )
}

async function Profile() {
  const viewer = await requireViewer()
  const profile = await getEditableProfile(sql, viewer.id)
  if (!profile) return null
  return <ProfileForm profile={profile} />
}

async function Account() {
  const viewer = await requireViewer()
  return (
    <div className={styles.account}>
      <div className={styles.accountText}>
        <span className={styles.accountName}>{viewer.displayName}</span>
        <span className={styles.accountHandle}>@{viewer.handle}</span>
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">Log out</Button>
      </form>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading profile">
      <Skeleton height="4rem" />
      <Skeleton height="7rem" />
      <Skeleton height="4rem" />
    </div>
  )
}
