import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { FamilyClient } from './FamilyClient'

// Dynamic rendering - no caching for instant updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FamilyPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <FamilyClient />
    </AppShell>
  )
}
