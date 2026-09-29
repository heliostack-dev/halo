import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { sql } from '#/server/db.ts'
import { requireViewer } from '#/server/auth/viewer.ts'
import { Handle } from '#/lib/ids.ts'
import { PageHeader } from '#/features/shell/page-header.tsx'
import { getOrCreateDm } from '#/features/messages/server/repo.ts'

export const metadata: Metadata = { title: 'New message' }

/** /messages/new?to=handle → the existing or a new 1:1 conversation. */
export default function NewMessagePage({ searchParams }: PageProps<'/messages/new'>) {
  return (
    <>
      <PageHeader back title="New message" />
      <Suspense>
        <OpenConversation searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function OpenConversation({ searchParams }: Pick<PageProps<'/messages/new'>, 'searchParams'>): Promise<never> {
  const viewer = await requireViewer()
  const to = Handle.safeParse((await searchParams).to)
  if (!to.success) notFound()
  const id = await getOrCreateDm(sql, viewer.id, to.data)
  if (id === 'missing') notFound()
  if (id === 'self') redirect('/messages')
  redirect(`/messages/${id}`)
}
