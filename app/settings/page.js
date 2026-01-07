import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get accounts, categories, API tokens, recurring incomes, and recurring transactions
  const [accounts, categories, apiTokens, recurringIncomes, recurringTransactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
    prisma.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        token: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.recurringIncome.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
        category: true,
      },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
        category: true,
      },
    }),
  ])

  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8">
        <Suspense fallback={<SettingsLoadingSkeleton />}>
          <SettingsClient
            initialAccounts={JSON.parse(JSON.stringify(accounts))}
            initialCategories={JSON.parse(JSON.stringify(categories))}
            initialTokens={JSON.parse(JSON.stringify(apiTokens))}
            initialRecurringIncomes={JSON.parse(JSON.stringify(recurringIncomes))}
            initialRecurringTransactions={JSON.parse(JSON.stringify(recurringTransactions))}
          />
        </Suspense>
      </div>
    </AppShell>
  )
}

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-light-surface dark:bg-dark-surface rounded-xl w-48" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-light-surface dark:bg-dark-surface rounded-xl w-32" />
        ))}
      </div>
      <div className="h-64 bg-light-surface dark:bg-dark-surface rounded-2xl" />
    </div>
  )
}
