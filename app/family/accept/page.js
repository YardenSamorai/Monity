import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
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

  const token = searchParams?.token

  return (
    <AppShell>
      <AcceptInvitationClient token={token} />
    </AppShell>
  )
}
