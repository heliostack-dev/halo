import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { Skeleton } from '#/ui/skeleton.tsx'
import { Thread } from '#/features/messages/components/thread.tsx'
import { getConversationScreen } from '#/features/messages/server/queries.ts'

export const metadata: Metadata = { title: 'Conversation' }

export default function ConversationPage({ params }: PageProps<'/messages/[conversationId]'>) {
  return (
    <Suspense fallback={<PageHeader back title={<Skeleton width="8rem" />} />}>
      <Conversation params={params} />
    </Suspense>
  )
}

async function Conversation({ params }: Pick<PageProps<'/messages/[conversationId]'>, 'params'>) {
  const { conversationId } = await params
  const { viewer, conversation, messages } = await getConversationScreen(conversationId)
  return (
    <>
      <PageHeader back title={conversation.other.displayName} subtitle={`@${conversation.other.handle}`} />
      <Thread conversationId={conversation.id} viewerId={viewer.id} otherName={conversation.other.displayName} initial={messages} />
    </>
  )
}
