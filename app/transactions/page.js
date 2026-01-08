import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { TransactionsClient } from './TransactionsClient'
import { TransactionsPageHeader } from './TransactionsPageHeader'
import { serializePrismaData } from '@/lib/utils'

export const revalidate = 30

export default async function TransactionsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get transactions, accounts, and categories with optimized select
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
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, balance: true, currency: true },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, color: true, icon: true },
    }),
  ])

  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        <TransactionsPageHeader transactionsCount={transactions.length} />
        
        <TransactionsClient
          initialTransactions={serializePrismaData(transactions)}
          accounts={serializePrismaData(accounts)}
          categories={serializePrismaData(categories)}
        />
      </div>
    </AppShell>
  )
}
