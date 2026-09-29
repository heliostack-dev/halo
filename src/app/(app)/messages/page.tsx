import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { ConversationList } from '#/features/messages/components/conversation-list.tsx'
import { ConversationListSkeleton } from '#/features/messages/components/messages-skeleton.tsx'

export const metadata: Metadata = { title: 'Messages' }

export default function MessagesPage() {
  return (
    <>
      <PageHeader title="Messages" />
      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationList />
      </Suspense>
    </>
  )
}
