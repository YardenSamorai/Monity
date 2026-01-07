import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { TransactionsClient } from './TransactionsClient'
import { TransactionsPageHeader } from './TransactionsPageHeader'

export default async function TransactionsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get transactions, accounts, and categories
  const [transactions, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      take: 100,
      orderBy: { date: 'desc' },
      include: {
        account: true,
        category: true,
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        <TransactionsPageHeader transactionsCount={transactions.length} />
        
        <TransactionsClient
          initialTransactions={JSON.parse(JSON.stringify(transactions))}
          accounts={JSON.parse(JSON.stringify(accounts))}
          categories={JSON.parse(JSON.stringify(categories))}
        />
      </div>
    </AppShell>
  )
}
