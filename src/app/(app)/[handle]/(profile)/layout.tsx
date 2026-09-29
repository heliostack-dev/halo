import { Suspense } from 'react'
import { ProfileTop } from '#/features/profiles/components/profile-top.tsx'
import { ProfileHeaderSkeleton } from '#/features/profiles/components/profile-header.tsx'

/** Not async: the handle is awaited inside the boundary so the app shell stays static. */
export default function ProfileLayout({ children, params }: LayoutProps<'/[handle]'>) {
  return (
    <>
      <Suspense fallback={<ProfileHeaderSkeleton />}>
        {params.then(({ handle }) => <ProfileTop handle={decodeURIComponent(handle)} />)}
      </Suspense>
      {children}
    </>
  )
}
