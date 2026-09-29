import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '#/features/auth/auth-forms.tsx'
import styles from '../auth.module.css'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <>
      <h1 className={styles.title}>Sign in to Halo</h1>
      <Suspense fallback={<LoginForm />}>
        {searchParams.then(({ next }) => <LoginForm next={typeof next === 'string' ? next : undefined} />)}
      </Suspense>
    </>
  )
}
