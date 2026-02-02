import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { InsightsClient } from './InsightsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function InsightsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <InsightsClient />
    </AppShell>
  )
}

