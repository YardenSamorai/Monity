import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { AcceptInvitationClient } from './AcceptInvitationClient'

// Dynamic rendering - no caching for instant updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AcceptInvitationPage({ searchParams }) {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // In Next.js 16, searchParams is a Promise
  const params = await searchParams
  const token = params?.token

  // Check if user needs onboarding
  if (!user.hasCompletedOnboarding) {
    // Check if user has any accounts (might have skipped onboarding before)
    const accountCount = await prisma.account.count({
      where: { userId: user.id }
    })
    
    if (accountCount === 0) {
      // Save the invitation token and redirect to onboarding
      // The token will be passed back after onboarding completes
      redirect(`/onboarding?returnTo=/family/accept&token=${token || ''}`)
    }
  }

  return (
    <AppShell>
      <AcceptInvitationClient token={token} />
    </AppShell>
  )
}
