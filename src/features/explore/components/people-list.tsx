import { sql } from '#/server/db.ts'
import { getViewer } from '#/server/auth/viewer.ts'
import { EmptyState } from '#/ui/empty-state.tsx'
import { searchUsers, suggestions } from '#/features/profiles/server/follows.ts'
import { UserCell } from '#/features/profiles/components/user-cell.tsx'

/** People matching a query. Personalised (follow state) → rendered behind Suspense. */
export async function PeopleResults({ q }: { q: string }) {
  const viewer = await getViewer()
  const users = await searchUsers(sql, viewer?.id ?? null, q)
  if (users.length === 0) {
    return <EmptyState title={`No people found for “${q}”`}>Try a handle, like @ada, or part of a name.</EmptyState>
  }
  return (
    <div>
      {users.map((u) => (
        <UserCell key={u.id} user={u} viewerId={viewer?.id ?? null} />
      ))}
    </div>
  )
}

export async function SuggestedPeople() {
  const viewer = await getViewer()
  const users = await suggestions(sql, viewer?.id ?? null, 10)
  if (users.length === 0) return null
  return (
    <div>
      {users.map((u) => (
        <UserCell key={u.id} user={u} viewerId={viewer?.id ?? null} />
      ))}
    </div>
  )
}
