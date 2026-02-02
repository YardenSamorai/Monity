import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import IPhoneSetupClient from './IPhoneSetupClient'

export const metadata = {
  title: 'iPhone Setup | Monity',
  description: 'Set up Monity on your iPhone for the best experience',
}

export default async function IPhoneSetupPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AppShell>
      <IPhoneSetupClient />
    </AppShell>
  )
}
