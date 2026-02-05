import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import QuickAddClient from './QuickAddClient'
import { I18nProvider } from '@/lib/i18n-context'
import { ToastProvider } from '@/lib/toast-context'

export const metadata = {
  title: 'Quick Add | Monity',
  description: 'Quickly add an expense',
}

export default async function QuickAddPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Fetch user's accounts, categories, credit cards, household and recent transactions for suggestions
  const [accounts, categories, creditCards, household, recentTransactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      select: { id: true, name: true, type: true, currency: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.category.findMany({
      where: {
        userId: user.id,
        type: { in: ['expense', 'both'] },
      },
      select: { id: true, name: true, icon: true, color: true },
      orderBy: { name: 'asc' },
    }),
    prisma.creditCard.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, lastFourDigits: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: { household: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, type: 'expense' },
      select: {
        amount: true,
        description: true,
        categoryId: true,
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
  ])

  // Extract recent amounts (unique, sorted by frequency)
  const amountCounts = {}
  recentTransactions.forEach(t => {
    const amount = Number(t.amount)
    amountCounts[amount] = (amountCounts[amount] || 0) + 1
  })
  const recentAmounts = Object.entries(amountCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([amount]) => Number(amount))

  // Extract recent merchants with their categories
  const merchantCategories = {}
  recentTransactions.forEach(t => {
    if (t.description && t.categoryId) {
      const merchant = t.description.toLowerCase().trim()
      if (!merchantCategories[merchant]) {
        merchantCategories[merchant] = {
          name: t.description,
          categoryId: t.categoryId,
          category: t.category,
          count: 0,
        }
      }
      merchantCategories[merchant].count++
    }
  })
  const recentMerchants = Object.values(merchantCategories)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Default account
  const defaultAccount = accounts[0] || null

  return (
    <I18nProvider>
      <ToastProvider>
        <QuickAddClient
          accounts={JSON.parse(JSON.stringify(accounts))}
          categories={JSON.parse(JSON.stringify(categories))}
          creditCards={JSON.parse(JSON.stringify(creditCards))}
          household={household?.household ? JSON.parse(JSON.stringify(household.household)) : null}
          recentAmounts={recentAmounts}
          recentMerchants={JSON.parse(JSON.stringify(recentMerchants))}
          defaultAccountId={defaultAccount?.id || null}
          currency={defaultAccount?.currency || 'ILS'}
        />
      </ToastProvider>
    </I18nProvider>
  )
}
