'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { Avatar } from '#/ui/avatar.tsx'
import { Button } from '#/ui/button.tsx'
import { useToast } from '#/ui/toast.tsx'
import { cx } from '#/ui/cx.ts'
import { idle, type ActionState } from '#/lib/action-state.ts'
import { createPostAction } from '../actions.ts'
import { POST_MAX_LENGTH } from '../types.ts'
import styles from './composer.module.css'

type ComposerProps = {
  viewer: { displayName: string; avatarHue: number }
  replyToId?: string
  quoteOfId?: string
  placeholder?: string
  autoFocus?: boolean
  /** Called after a successful post (e.g. close the compose dialog). */
  onPosted?: (post: { id: string; handle: string }) => void
  variant?: 'inline' | 'dialog'
  children?: React.ReactNode
}

export function Composer({ viewer, replyToId, quoteOfId, placeholder = 'What’s happening?', autoFocus, onPosted, variant = 'inline', children }: ComposerProps) {
  const [state, action, pending] = useActionState<ActionState<{ id: string; handle: string }>, FormData>(createPostAction, idle)
  const [length, setLength] = useState(0)
  const toast = useToast()
  const inputId = useId()
  const handled = useRef<typeof state>(state)

  useEffect(() => {
    if (state === handled.current) return
    handled.current = state
    if (state.status === 'success') {
      setLength(0)
      if (state.message) toast(state.message)
      onPosted?.(state.data)
    }
  }, [state, toast, onPosted])

  const remaining = POST_MAX_LENGTH - length
  const error = state.status === 'error' ? (state.fieldErrors?.body?.[0] ?? state.formError) : undefined

  return (
    <form action={action} className={cx(styles.composer, styles[variant])}>
      <Avatar name={viewer.displayName} hue={viewer.avatarHue} />
      <div className={styles.main}>
        {replyToId ? <input type="hidden" name="replyToId" value={replyToId} /> : null}
        {quoteOfId ? <input type="hidden" name="quoteOfId" value={quoteOfId} /> : null}
        <label htmlFor={inputId} className="visually-hidden">{placeholder}</label>
        <textarea
          id={inputId}
          name="body"
          className={styles.input}
          placeholder={placeholder}
          maxLength={POST_MAX_LENGTH + 20}
          rows={2}
          autoFocus={autoFocus}
          data-autofocus={autoFocus || undefined}
          defaultValue={state.status === 'error' ? state.values?.body : undefined}
          key={state.status === 'success' ? state.data.id : 'draft'}
          onChange={(e) => setLength(e.currentTarget.value.length)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit()
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {children}
        {error ? <p id={`${inputId}-error`} className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.toolbar}>
          {length > 0 ? <Meter remaining={remaining} /> : null}
          <Button type="submit" pending={pending} disabled={length === 0 || remaining < 0}>
            {replyToId ? 'Reply' : 'Post'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** Circular character meter, like the one users know from other networks. */
function Meter({ remaining }: { remaining: number }) {
  const used = Math.min(1, (POST_MAX_LENGTH - remaining) / POST_MAX_LENGTH)
  const tone = remaining < 0 ? styles.over : remaining <= 20 ? styles.warn : undefined
  return (
    <span className={cx(styles.meter, tone)} aria-live="polite" aria-label={`${remaining} characters remaining`}>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" className={styles.track} />
        <circle cx="12" cy="12" r="10" className={styles.progress} pathLength={100} strokeDasharray={`${used * 100} 100`} />
      </svg>
      {remaining <= 20 ? <span className={styles.remaining}>{remaining}</span> : null}
    </span>
  )
}
