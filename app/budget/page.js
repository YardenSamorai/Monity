import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { BudgetClient } from './BudgetClient'
import { getMonthRange, serializePrismaData } from '@/lib/utils'
import { unstable_cache } from 'next/cache'

export const revalidate = 30

const getBudgetData = unstable_cache(
  async (userId, month, year, start, end) => {
    const [budgets, categories, expenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId, month, year },
        select: {
          id: true,
          amount: true,
          categoryId: true,
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      }),
      prisma.category.findMany({
        where: {
          userId,
          type: { in: ['expense', 'both'] },
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true, color: true, icon: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: start, lte: end },
        },
        select: { id: true, amount: true, categoryId: true },
      }),
    ])
    
    return { budgets, categories, expenses }
  },
  ['budget-data'],
  { revalidate: 30, tags: ['budget'] }
)

export default async function BudgetPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  const { budgets, categories, expenses } = await getBudgetData(
    user.id, currentMonth, currentYear, start, end
  )
  
  // Calculate actuals per category
  const actualsByCategory = {}
  expenses.forEach(expense => {
    const catId = expense.categoryId || 'uncategorized'
    actualsByCategory[catId] = (actualsByCategory[catId] || 0) + Number(expense.amount)
  })
  
  const budgetData = budgets.map(budget => ({
    ...budget,
    actual: actualsByCategory[budget.categoryId || 'uncategorized'] || 0,
  }))
  
  const totalBudget = budgetData.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalActual = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <AppShell>
      <BudgetClient
        initialBudgets={serializePrismaData(budgetData)}
        categories={serializePrismaData(categories)}
        totalBudget={totalBudget}
        totalActual={totalActual}
        month={currentMonth}
        year={currentYear}
        currentDate={now.toISOString()}
      />
    </AppShell>
  )
}
