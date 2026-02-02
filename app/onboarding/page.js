import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { OnboardingClient } from './OnboardingClient'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Welcome to Monity',
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // If user has already completed onboarding, redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect('/dashboard')
  }

  // Get user's categories for the forms
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' }
  })

  return <OnboardingClient categories={categories} />
}

