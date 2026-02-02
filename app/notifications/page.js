import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { NotificationsClient } from './NotificationsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <NotificationsClient />
    </AppShell>
  )
}

