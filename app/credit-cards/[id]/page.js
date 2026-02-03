import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import { CreditCardDetailClient } from './CreditCardDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Credit Card Details | Monity',
}

export default async function CreditCardDetailPage({ params }) {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { id } = await params

  return (
    <AppShell>
      <CreditCardDetailClient cardId={id} />
    </AppShell>
  )
}
