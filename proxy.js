import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't need auth
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/install(.*)',
  '/quick-add(.*)',
  '/api/webhook(.*)',
  '/api/cron(.*)',
])

// Define protected routes that MUST have auth
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/transactions(.*)',
  '/analytics(.*)',
  '/budget(.*)',
  '/goals(.*)',
  '/settings(.*)',
  '/family(.*)',
  '/notifications(.*)',
  '/insights(.*)',
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without auth
  if (isPublicRoute(req)) {
    return
  }
  
  // Protect specific routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  
  // API routes: let them through - they handle auth internally
  // This prevents redirect loops
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
}

