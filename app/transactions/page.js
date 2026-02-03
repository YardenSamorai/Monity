import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { TransactionsClient } from './TransactionsClient'
import { serializePrismaData } from '@/lib/utils'

// Force dynamic rendering - no caching for instant updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TransactionsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  const [transactions, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      take: 100,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        notes: true,
        isShared: true,
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
        savingsGoal: { select: { id: true, name: true } },
        tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, balance: true, currency: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, color: true, icon: true },
    }),
  ])

  return (
    <AppShell>
      <TransactionsClient
        initialTransactions={serializePrismaData(transactions)}
        accounts={serializePrismaData(accounts)}
        categories={serializePrismaData(categories)}
      />
    </AppShell>
  )
}
