import { EmptyState } from '#/ui/empty-state.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { getProfile } from '../server/queries.ts'

const EMPTY = {
  posts: ['No posts yet', 'When they post, their posts will show up here.'],
  replies: ['No replies yet', 'Replies they write will show up here.'],
  likes: ['No likes yet', 'Posts they like will show up here.'],
} as const

/** One of the profile tabs. Resolves the handle to a user id via the cached profile. */
export async function ProfileFeed({ params, tab }: { params: Promise<{ handle: string }>; tab: 'posts' | 'replies' | 'likes' }) {
  const { handle } = await params
  const profile = await getProfile(decodeURIComponent(handle))
  const [title, body] = EMPTY[tab]
  return (
    <FeedSection
      feedKey={tab === 'likes' ? { kind: 'likes', userId: profile.id } : { kind: 'user', userId: profile.id, mode: tab }}
      empty={<EmptyState title={title}>{body}</EmptyState>}
    />
  )
}
