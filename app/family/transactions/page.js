import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { FamilyTransactionsClient } from './FamilyTransactionsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Family Transactions | Monity',
}

export default async function FamilyTransactionsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <FamilyTransactionsClient />
    </AppShell>
  )
}
