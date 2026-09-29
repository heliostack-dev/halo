'use client'

import { useLayoutEffect, useRef } from 'react'

/** When a thread has ancestors, open the page scrolled to the focused post (like other networks). */
export function PostDetailAnchor() {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    ref.current?.parentElement?.scrollIntoView({ block: 'start' })
  }, [])
  return <span ref={ref} hidden />
}
