import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { BudgetClient } from './BudgetClient'
import { getMonthRange, serializePrismaData } from '@/lib/utils'

export const revalidate = 30

export default async function BudgetPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get current month
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  // Fetch all data in parallel with optimized select
  const [budgets, categories, expenses] = await Promise.all([
    // Get budgets for current month
    prisma.budget.findMany({
      where: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
      },
      select: {
        id: true,
        amount: true,
        categoryId: true,
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
    
    // Get all expense categories
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id, type: 'expense' },
          { userId: user.id, type: 'both' },
          { isDefault: true, type: 'expense' },
          { isDefault: true, type: 'both' },
        ],
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, color: true, icon: true },
    }),
    
    // Get actual expenses for current month - only needed fields
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: start, lte: end },
      },
      select: { id: true, amount: true, categoryId: true },
    }),
  ])
  
  // Calculate actuals per category
  const actualsByCategory = {}
  expenses.forEach(expense => {
    const catId = expense.categoryId || 'uncategorized'
    actualsByCategory[catId] = (actualsByCategory[catId] || 0) + Number(expense.amount)
  })
  
  // Combine budgets with actuals
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
