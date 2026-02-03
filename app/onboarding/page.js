import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { OnboardingClient } from './OnboardingClient'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Welcome to Monity',
}

export default async function OnboardingPage({ searchParams }) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // In Next.js 16, searchParams is a Promise
  const params = await searchParams
  const returnTo = params?.returnTo || null
  const token = params?.token || null

  // If user has already completed onboarding, redirect to returnTo or dashboard
  if (user.hasCompletedOnboarding) {
    if (returnTo && token) {
      redirect(`${returnTo}?token=${token}`)
    }
    redirect('/dashboard')
  }

  // Get user's categories for the forms
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' }
  })

  // Build redirect URL for after onboarding
  const redirectAfterOnboarding = returnTo && token 
    ? `${returnTo}?token=${token}` 
    : '/dashboard'

  return <OnboardingClient categories={categories} redirectTo={redirectAfterOnboarding} />
}

