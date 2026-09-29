'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '#/ui/button.tsx'
import { TextField } from '#/ui/text-field.tsx'
import { idle } from '#/lib/action-state.ts'
import { loginAction, signupAction } from './actions.ts'
import styles from './auth-forms.module.css'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, idle)
  const errors = state.status === 'error' ? state : undefined
  return (
    <form action={action} className={styles.form} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {errors?.formError ? <p className={styles.formError} role="alert">{errors.formError}</p> : null}
      <TextField label="Email or @handle" name="identifier" autoComplete="username" required defaultValue={errors?.values?.identifier} errors={errors?.fieldErrors?.identifier} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required errors={errors?.fieldErrors?.password} />
      <Button type="submit" variant="inverted" size="lg" block pending={pending}>Sign in</Button>
      <p className={styles.alt}>Don’t have an account? <Link href="/signup">Sign up</Link></p>
    </form>
  )
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, idle)
  const errors = state.status === 'error' ? state : undefined
  const v = errors?.values
  return (
    <form action={action} className={styles.form} noValidate>
      {errors?.formError ? <p className={styles.formError} role="alert">{errors.formError}</p> : null}
      <TextField label="Name" name="displayName" autoComplete="name" required maxLength={50} defaultValue={v?.displayName} errors={errors?.fieldErrors?.displayName} />
      <TextField label="Handle" name="handle" autoComplete="username" required maxLength={15} defaultValue={v?.handle} errors={errors?.fieldErrors?.handle} hint="Letters, numbers and underscores. This is your @name." />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={v?.email} errors={errors?.fieldErrors?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} errors={errors?.fieldErrors?.password} hint="At least 8 characters." />
      <Button type="submit" variant="inverted" size="lg" block pending={pending}>Create account</Button>
      <p className={styles.alt}>Have an account already? <Link href="/login">Sign in</Link></p>
    </form>
  )
}
