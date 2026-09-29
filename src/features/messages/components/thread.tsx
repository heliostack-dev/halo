'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from 'react'
import { Button } from '#/ui/button.tsx'
import { IconButton } from '#/ui/icon-button.tsx'
import { useToast } from '#/ui/toast.tsx'
import { cx } from '#/ui/cx.ts'
import { useRealtime } from '#/features/realtime/realtime.tsx'
import { RelativeTime } from '#/features/posts/components/relative-time.tsx'
import { loadOlderMessagesAction, markConversationReadAction, sendMessageAction } from '../actions.ts'
import { MESSAGE_MAX_LENGTH, type MessageView } from '../types.ts'
import styles from './messages.module.css'

type ThreadProps = {
  conversationId: string
  viewerId: string
  otherName: string
  initial: { items: MessageView[]; olderCursor: string | null }
}

type Shown = MessageView & { pending?: boolean }

const GROUP_GAP_MS = 5 * 60_000

/**
 * Chat thread. Server-rendered history, optimistic sends, realtime refresh for incoming
 * messages. The newest message stays in view.
 */
export function Thread({ conversationId, viewerId, otherName, initial }: ThreadProps) {
  const router = useRouter()
  const toast = useToast()
  const [older, setOlder] = useState<MessageView[]>([])
  const [olderCursor, setOlderCursor] = useState(initial.olderCursor)
  const [sent, setSent] = useState<MessageView[]>([])
  const [seen, setSeen] = useState(initial)
  const [loadingOlder, startLoadingOlder] = useTransition()
  const [optimistic, addOptimistic] = useOptimistic<Shown[], Shown>([], (list, m) => [...list, m])
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  // Fresh server data (after router.refresh) already contains everything we sent.
  if (seen !== initial) {
    setSeen(initial)
    setSent([])
  }

  const ids = new Set<string>()
  const messages: Shown[] = [...older, ...initial.items, ...sent, ...optimistic].filter((m) => !ids.has(m.id) && ids.add(m.id))

  useLayoutEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  useEffect(() => {
    markConversationReadAction(conversationId).catch(() => {})
  }, [conversationId, initial])

  useRealtime('message', (event) => {
    if (event.conversationId === conversationId) startTransition(() => router.refresh())
  })

  function send() {
    const el = input.current
    const body = el?.value.trim() ?? ''
    if (!el || !body) return
    if (body.length > MESSAGE_MAX_LENGTH) return toast(`Keep it under ${MESSAGE_MAX_LENGTH} characters`, { tone: 'danger' })
    el.value = ''
    startTransition(async () => {
      addOptimistic({ id: `pending-${Date.now()}`, senderId: viewerId, body, createdAt: new Date().toISOString(), pending: true })
      const result = await sendMessageAction(conversationId, body)
      if (result.status === 'success') startTransition(() => setSent((list) => [...list, result.data]))
      else {
        el.value = body
        toast(result.status === 'error' ? (result.formError ?? result.fieldErrors?.body?.[0] ?? 'Message not sent') : 'Message not sent', { tone: 'danger' })
      }
    })
  }

  function loadOlder() {
    if (!olderCursor) return
    startLoadingOlder(async () => {
      const page = await loadOlderMessagesAction(conversationId, olderCursor)
      setOlder((list) => [...page.items, ...list])
      setOlderCursor(page.olderCursor)
    })
  }

  return (
    <div className={styles.thread} data-hide-fab="">
      <div className={styles.messages} role="log" aria-label={`Conversation with ${otherName}`}>
        {olderCursor ? (
          <div className={styles.older}>
            <Button variant="outline" size="sm" onClick={loadOlder} pending={loadingOlder}>Load earlier messages</Button>
          </div>
        ) : null}
        {messages.map((m, i) => {
          const mine = m.senderId === viewerId
          const next = messages[i + 1]
          const endOfGroup = !next || next.senderId !== m.senderId || Date.parse(next.createdAt) - Date.parse(m.createdAt) > GROUP_GAP_MS
          return (
            <div key={m.id} className={cx(styles.message, mine ? styles.mine : styles.theirs, endOfGroup && styles.groupEnd)}>
              <p className={cx(styles.bubble, m.pending && styles.pending)}>{m.body}</p>
              {endOfGroup ? (
                <span className={styles.stamp}>{m.pending ? 'Sending…' : <RelativeTime date={m.createdAt} />}</span>
              ) : null}
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <label htmlFor="message-input" className="visually-hidden">Message {otherName}</label>
        <textarea
          id="message-input"
          ref={input}
          name="body"
          rows={1}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Start a new message"
          className={styles.input}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              send()
            }
          }}
        />
        <IconButton icon="send" label="Send" type="submit" className={styles.send} />
      </form>
    </div>
  )
}
