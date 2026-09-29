import { NextResponse, type NextRequest } from 'next/server'

// Optimistic routing only: checks that a session cookie exists, never that it is valid.
// Real authorization happens next to the data (requireViewer / getViewer).
const SESSION_COOKIE = 'hs_session'
// /home (For you), profiles, posts, explore and hashtags are public; these need an account.
const PRIVATE = ['/home/following', '/notifications', '/messages', '/bookmarks', '/settings', '/compose']
const GUEST_ONLY = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

  if (!hasSession && PRIVATE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }
  if (hasSession && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icons.svg|favicon.ico).*)'],
}
