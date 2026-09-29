import { Suspense } from 'react'
import { ComposeRoute } from '#/features/posts/components/compose-route.tsx'

export default function InterceptedCompose({ searchParams }: PageProps<'/compose/post'>) {
  return (
    <Suspense>
      <ComposeRoute searchParams={searchParams} />
    </Suspense>
  )
}
