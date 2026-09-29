import { getViewer } from '#/server/auth/viewer.ts'
import type { FeedKey } from '../feed-key.ts'
import { getFeedPage } from '../server/queries.ts'
import { Feed } from './feed.tsx'

/** Server entry for any feed: fetches the first page, hands pagination to the client <Feed>. */
export async function FeedSection({ feedKey, empty }: { feedKey: FeedKey; empty?: React.ReactNode }) {
  const [viewer, initial] = await Promise.all([getViewer(), getFeedPage(feedKey)])
  return <Feed feedKey={feedKey} initial={initial} signedIn={viewer !== null} empty={empty} />
}
