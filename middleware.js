import { NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/install',
  '/quick-add',
]

function isPublic(pathname) {
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session_token')?.value
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
}
