'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '#/ui/button.tsx'
import { TextField } from '#/ui/text-field.tsx'
import { TextArea } from '#/ui/textarea.tsx'
import { useToast } from '#/ui/toast.tsx'
import { idle, type ActionState } from '#/lib/action-state.ts'
import { updateProfileAction } from '../actions.ts'
import type { EditableProfile } from '../server/repo.ts'
import styles from './settings.module.css'

export function ProfileForm({ profile }: { profile: EditableProfile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfileAction, idle)
  const toast = useToast()
  const handled = useRef<ActionState>(state)

  useEffect(() => {
    if (state === handled.current) return
    handled.current = state
    if (state.status === 'success') toast(state.message ?? 'Saved')
  }, [state, toast])

  const errors = state.status === 'error' ? state : undefined
  // After a failed submit, show what the user typed rather than the stored value.
  const value = (key: keyof EditableProfile) => errors?.values?.[key] ?? profile[key]

  return (
    <form action={action} className={styles.form} noValidate>
      {errors?.formError ? <p className={styles.formError} role="alert">{errors.formError}</p> : null}
      <TextField label="Name" name="displayName" required maxLength={50} autoComplete="name" defaultValue={value('displayName')} errors={errors?.fieldErrors?.displayName} />
      <TextArea label="Bio" name="bio" maxLength={160} counter rows={3} defaultValue={value('bio')} errors={errors?.fieldErrors?.bio} />
      <div className={styles.row}>
        <TextField label="Location" name="location" maxLength={30} defaultValue={value('location')} errors={errors?.fieldErrors?.location} />
        <TextField label="Website" name="website" type="url" inputMode="url" maxLength={100} placeholder="https://" defaultValue={value('website')} errors={errors?.fieldErrors?.website} />
      </div>
      <div className={styles.actions}>
        <Button type="submit" pending={pending}>Save</Button>
      </div>
    </form>
  )
}
