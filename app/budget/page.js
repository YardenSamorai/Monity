import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { BudgetClient } from './BudgetClient'
import { getMonthRange } from '@/lib/utils'

export default async function BudgetPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get current month
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  // Get budgets for current month
  const budgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month: currentMonth,
      year: currentYear,
    },
    include: {
      category: true,
    },
  })
  
  // Get all expense categories
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id, type: 'expense' },
        { userId: user.id, type: 'both' },
        { isDefault: true, type: 'expense' },
        { isDefault: true, type: 'both' },
      ],
    },
    orderBy: { name: 'asc' },
  })
  
  // Get actual expenses for current month
  const expenses = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: 'expense',
      date: { gte: start, lte: end },
    },
  })
  
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
        initialBudgets={JSON.parse(JSON.stringify(budgetData))}
        categories={JSON.parse(JSON.stringify(categories))}
        totalBudget={totalBudget}
        totalActual={totalActual}
        month={currentMonth}
        year={currentYear}
        currentDate={now.toISOString()}
      />
    </AppShell>
  )
}
