import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { SettingsClient } from './SettingsClient'
import { serializePrismaData } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get accounts, categories, API tokens, recurring incomes, and recurring transactions
  // Using Promise.all for parallel execution and select for optimized queries
  const [accounts, categories, apiTokens, recurringIncomes, recurringTransactions] = await Promise.all([
    // Accounts - only select needed fields
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    
    // Categories - only select needed fields
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
        isDefault: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    
    // API Tokens - already optimized with select
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
    
    // Recurring Incomes - select only needed fields from relations
    prisma.recurringIncome.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        description: true,
        dayOfMonth: true,
        isActive: true,
        nextRunDate: true,
        lastRunDate: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    }),
    
    // Recurring Transactions - select only needed fields from relations
    prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        dayOfMonth: true,
        isActive: true,
        nextRunDate: true,
        lastRunDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    }),
  ])

  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8">
        <SettingsClient
          initialAccounts={serializePrismaData(accounts)}
          initialCategories={serializePrismaData(categories)}
          initialTokens={serializePrismaData(apiTokens)}
          initialRecurringIncomes={serializePrismaData(recurringIncomes)}
          initialRecurringTransactions={serializePrismaData(recurringTransactions)}
        />
      </div>
    </AppShell>
  )
}
