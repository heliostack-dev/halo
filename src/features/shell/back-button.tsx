'use client'

import { useRouter } from 'next/navigation'
import { IconButton } from '#/ui/icon-button.tsx'

export function BackButton() {
  const router = useRouter()
  return (
    <IconButton
      icon="arrow-left"
      label="Back"
      onClick={() => (history.length > 1 ? router.back() : router.push('/home'))}
    />
  )
}
