import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { GoalsClient } from './GoalsClient'
import { unstable_cache } from 'next/cache'

export const revalidate = 30

const getGoalsData = unstable_cache(
  async (userId) => {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
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
    return goals
  },
  ['goals-data'],
  { revalidate: 30, tags: ['goals'] }
)

export default async function GoalsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  const [goals, accounts, creditCards] = await Promise.all([
    getGoalsData(user.id),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.creditCard.findMany({
      where: { userId: user.id, isActive: true },
      select: { id: true, name: true, lastFourDigits: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Helper to safely convert date to string
  const formatDate = (date) => {
    if (!date) return null
    if (typeof date === 'string') return date.split('T')[0]
    if (date instanceof Date) return date.toISOString().split('T')[0]
    return null
  }

  // Transform to match component expectations
  const transformedGoals = goals.map(goal => ({
    id: goal.id,
    name: goal.name,
    icon: goal.icon,
    targetAmount: Number(goal.targetAmount),
    savedAmount: Number(goal.currentAmount),
    targetDate: formatDate(goal.targetDate),
    priority: goal.priority,
    contributionMode: goal.contributionMode,
    fixedMonthlyAmount: goal.fixedMonthlyAmount ? Number(goal.fixedMonthlyAmount) : null,
    isPaused: goal.isPaused,
    createdAt: formatDate(goal.createdAt),
    contributions: goal.contributions.map(c => ({
      amount: Number(c.amount),
      date: formatDate(c.date),
      note: c.note || '',
    })),
  }))

  return (
    <AppShell>
      <GoalsClient 
        initialGoals={transformedGoals}
        accounts={JSON.parse(JSON.stringify(accounts))}
        creditCards={JSON.parse(JSON.stringify(creditCards))}
      />
    </AppShell>
  )
}
