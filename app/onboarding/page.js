import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { OnboardingClient } from './OnboardingClient'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Welcome to Monity',
}

export default async function OnboardingPage({ searchParams }) {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  const params = await searchParams
  const returnTo = params?.returnTo || null
  const token = params?.token || null

  if (user.hasCompletedOnboarding) {
    if (returnTo && token) {
      redirect(`${returnTo}?token=${token}`)
    }
    redirect('/dashboard')
  }

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' }
  })

  const redirectAfterOnboarding = returnTo && token
    ? `${returnTo}?token=${token}`
    : '/dashboard'

  return <OnboardingClient categories={categories} redirectTo={redirectAfterOnboarding} />
}
