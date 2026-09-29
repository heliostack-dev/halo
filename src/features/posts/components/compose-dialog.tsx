'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Dialog } from '#/ui/dialog.tsx'
import { Composer } from './composer.tsx'

/** Compose as a route: /compose/post opens this dialog over the current page (intercepted). */
export function ComposeDialog({ viewer, replyToId, quoteOfId, context }: {
  viewer: { displayName: string; avatarHue: number }
  replyToId?: string
  quoteOfId?: string
  context?: ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const close = () => {
    setOpen(false)
    router.back()
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()} title={replyToId ? 'Reply' : quoteOfId ? 'Quote' : 'New post'} hideTitle>
      {replyToId ? context : null}
      <Composer
        viewer={viewer}
        variant="dialog"
        autoFocus
        replyToId={replyToId}
        quoteOfId={quoteOfId}
        placeholder={replyToId ? 'Post your reply' : quoteOfId ? 'Add a comment' : 'What’s happening?'}
        onPosted={close}
      >
        {quoteOfId ? context : null}
      </Composer>
    </Dialog>
  )
}
