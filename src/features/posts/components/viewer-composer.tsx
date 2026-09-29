import { getViewer } from '#/server/auth/viewer.ts'
import { Composer } from './composer.tsx'

/** Inline composer for the signed-in viewer; renders nothing for visitors. */
export async function ViewerComposer(props: { replyToId?: string; placeholder?: string }) {
  const viewer = await getViewer()
  if (!viewer) return null
  return <Composer viewer={viewer} {...props} />
}
