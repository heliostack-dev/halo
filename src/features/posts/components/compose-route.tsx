import { redirect } from 'next/navigation'
import * as z from 'zod'
import { getViewer } from '#/server/auth/viewer.ts'
import { Id } from '#/lib/ids.ts'
import { getPostForCompose } from '../server/queries.ts'
import { ComposeDialog } from './compose-dialog.tsx'
import { QuoteCard } from './quote-card.tsx'
import { PostText } from './post-text.tsx'
import { AuthorLine } from './author-line.tsx'
import styles from './compose-route.module.css'

const Params = z.object({ reply: Id.optional().catch(undefined), quote: Id.optional().catch(undefined) })

/** Shared by the intercepted modal and the full-page /compose/post route. */
export async function ComposeRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  const { reply, quote } = Params.parse(await searchParams)
  const target = reply ?? quote ? await getPostForCompose((reply ?? quote)!) : null

  const context = target ? (
    reply ? (
      <div className={styles.replyContext}>
        <AuthorLine author={target.author} createdAt={target.createdAt} />
        <PostText body={target.body} />
        <p className={styles.replying}>Replying to <strong>@{target.author.handle}</strong></p>
      </div>
    ) : (
      <QuoteCard post={target} />
    )
  ) : null

  return (
    <ComposeDialog
      viewer={viewer}
      replyToId={target && reply ? target.id : undefined}
      quoteOfId={target && quote ? target.id : undefined}
      context={context}
    />
  )
}
