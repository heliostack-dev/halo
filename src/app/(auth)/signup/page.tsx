import type { Metadata } from 'next'
import { SignupForm } from '#/features/auth/auth-forms.tsx'
import styles from '../auth.module.css'

export const metadata: Metadata = { title: 'Create your account' }

export default function SignupPage() {
  return (
    <>
      <h1 className={styles.title}>Create your account</h1>
      <SignupForm />
    </>
  )
}
