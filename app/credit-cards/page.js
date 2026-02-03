import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { CreditCardsClient } from './CreditCardsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Credit Cards | Monity',
}

export default async function CreditCardsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <CreditCardsClient />
    </AppShell>
  )
}
