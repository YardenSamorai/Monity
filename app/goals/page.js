import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { GoalsClient } from './GoalsClient'

export const revalidate = 30

export default async function GoalsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Fetch goals from database with optimized select
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      icon: true,
      targetAmount: true,
      currentAmount: true,
      targetDate: true,
      priority: true,
      contributionMode: true,
      fixedMonthlyAmount: true,
      isPaused: true,
      createdAt: true,
      contributions: {
        orderBy: { date: 'desc' },
        select: { amount: true, date: true, note: true },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // Transform to match component expectations
  const transformedGoals = goals.map(goal => ({
    id: goal.id,
    name: goal.name,
    icon: goal.icon,
    targetAmount: Number(goal.targetAmount),
    savedAmount: Number(goal.currentAmount),
    targetDate: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : null,
    priority: goal.priority,
    contributionMode: goal.contributionMode,
    fixedMonthlyAmount: goal.fixedMonthlyAmount ? Number(goal.fixedMonthlyAmount) : null,
    isPaused: goal.isPaused,
    createdAt: goal.createdAt.toISOString().split('T')[0],
    contributions: goal.contributions.map(c => ({
      amount: Number(c.amount),
      date: c.date.toISOString().split('T')[0],
      note: c.note || '',
    })),
  }))

  return (
    <AppShell>
      <GoalsClient initialGoals={transformedGoals} />
    </AppShell>
  )
}
