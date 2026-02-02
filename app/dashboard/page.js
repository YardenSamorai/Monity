import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { DashboardClient } from './DashboardClient'
import { getMonthRange, serializePrismaData } from '@/lib/utils'
import { unstable_cache } from 'next/cache'

// Allow caching for 30 seconds, then revalidate in background
export const revalidate = 30

// Cache dashboard data per user
const getDashboardData = unstable_cache(
  async (userId) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const { start, end } = getMonthRange(currentYear, currentMonth)
    
    // Get previous month range
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth)
    
    const [
      accounts,
      monthlyTransactions,
      lastMonthTransactions,
      recurringIncomes,
      recurringTransactions,
      recentTransactions,
      categories,
      budgets,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          categoryId: true,
          recurringTransactionId: true,
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      }),
      // Last month transactions for comparison
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: prevStart, lte: prevEnd },
        },
        select: {
          id: true,
          type: true,
          amount: true,
        },
      }),
      prisma.recurringIncome.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          amount: true,
          nextRunDate: true,
          lastRunDate: true,
        },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          dayOfMonth: true,
          nextRunDate: true,
          lastRunDate: true,
          endDate: true,
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      }),
      prisma.transaction.findMany({
        where: { userId },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          icon: true,
        },
      }),
      // Current month budgets
      prisma.budget.findMany({
        where: {
          userId,
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
    ])
    
    return {
      accounts,
      monthlyTransactions,
      lastMonthTransactions,
      recurringIncomes,
      recurringTransactions,
      recentTransactions,
      categories,
      budgets,
      fetchedAt: now.toISOString(),
    }
  },
  ['dashboard-data'],
  { revalidate: 30, tags: ['dashboard'] }
)

export default async function DashboardPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  // Get cached data
  const {
    accounts,
    monthlyTransactions,
    lastMonthTransactions,
    recurringIncomes,
    recurringTransactions,
    recentTransactions,
    categories,
    budgets,
  } = await getDashboardData(user.id)
  
  // Check if user needs onboarding
  if (!user.hasCompletedOnboarding && accounts.length === 0) {
    redirect('/onboarding')
  }
  
  // Process data
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
  const actualRecurringExpenses = monthlyExpenses.filter(t => t.recurringTransactionId)
  const recurringExpenseDefinitions = recurringTransactions.filter(rt => rt.type === 'expense')
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const recurringIncomeAmount = recurringIncomes.reduce((sum, ri) => {
    const shouldBeProcessed = ri.nextRunDate <= end && ri.nextRunDate >= start
    const scheduledThisMonth = new Date(ri.nextRunDate).getMonth() === now.getMonth() && 
                                new Date(ri.nextRunDate).getFullYear() === now.getFullYear()
    
    if (shouldBeProcessed || scheduledThisMonth || !ri.lastRunDate) {
      return sum + Number(ri.amount)
    }
    return sum
  }, 0)
  
  const recurringTransactionIncomeAmount = recurringTransactions
    .filter(rt => rt.type === 'income')
    .reduce((sum, rt) => {
      const shouldBeProcessed = rt.nextRunDate <= end && rt.nextRunDate >= start
      const scheduledThisMonth = new Date(rt.nextRunDate).getMonth() === now.getMonth() && 
                                  new Date(rt.nextRunDate).getFullYear() === now.getFullYear()
      
      if (shouldBeProcessed || scheduledThisMonth || !rt.lastRunDate) {
        return sum + Number(rt.amount)
      }
      return sum
    }, 0)
  
  const totalIncomeWithRecurring = totalIncome + recurringIncomeAmount + recurringTransactionIncomeAmount
  const totalExpenses = monthlyExpenses.reduce((sum, t) => sum + Number(t.amount), 0)
  
  const recurringExpenseIdsWithTransactions = new Set(
    actualRecurringExpenses.map(e => e.recurringTransactionId).filter(Boolean)
  )
  
  const recurringExpenseAmount = recurringExpenseDefinitions
    .filter(re => !recurringExpenseIdsWithTransactions.has(re.id))
    .filter(re => !re.endDate || new Date(re.endDate) >= now)
    .reduce((sum, re) => sum + Number(re.amount), 0)
  
  const totalExpensesWithRecurring = totalExpenses + recurringExpenseAmount
  const netCashFlow = totalIncomeWithRecurring - totalExpensesWithRecurring
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
  
  // Calculate last month expenses for comparison
  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Calculate spending by category
  const spendingByCategory = {}
  monthlyExpenses.forEach(t => {
    const catId = t.categoryId || 'uncategorized'
    const catName = t.category?.name || 'Uncategorized'
    const catIcon = t.category?.icon || '📦'
    const catColor = t.category?.color || '#888888'
    
    if (!spendingByCategory[catId]) {
      spendingByCategory[catId] = { name: catName, icon: catIcon, color: catColor, amount: 0 }
    }
    spendingByCategory[catId].amount += Number(t.amount)
  })
  
  // Top 5 categories by spending
  const topCategories = Object.entries(spendingByCategory)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
  
  // Calculate budget alerts
  const budgetAlerts = budgets.map(budget => {
    const spent = monthlyExpenses
      .filter(t => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const budgetAmount = Number(budget.amount)
    const remaining = budgetAmount - spent
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
    
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category?.name || 'Uncategorized',
      categoryIcon: budget.category?.icon || '📦',
      budgetAmount,
      spent,
      remaining,
      percentage,
      isOver: percentage > 100,
      isNearLimit: percentage >= 80 && percentage <= 100,
    }
  }).filter(b => b.isOver || b.isNearLimit)
  
  // Find biggest expense
  const biggestExpense = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max, monthlyExpenses[0])
    : null

  return (
    <AppShell>
      <DashboardClient
        totalBalance={totalBalance}
        totalIncome={totalIncomeWithRecurring}
        totalExpenses={totalExpensesWithRecurring}
        netCashFlow={netCashFlow}
        accounts={serializePrismaData(accounts)}
        recentTransactions={serializePrismaData(recentTransactions)}
        currentDate={now.toISOString()}
        recurringIncomeAmount={recurringIncomeAmount + recurringTransactionIncomeAmount}
        recurringExpenseAmount={recurringExpenseAmount}
        actualIncome={totalIncome}
        actualExpenses={totalExpenses}
        categories={serializePrismaData(categories)}
        monthlyExpenses={serializePrismaData(monthlyExpenses)}
        recurringExpenses={serializePrismaData(actualRecurringExpenses)}
        recurringExpenseDefinitions={serializePrismaData(recurringExpenseDefinitions)}
        // Insights data
        lastMonthExpenses={lastMonthExpenses}
        topCategories={topCategories}
        budgetAlerts={budgetAlerts}
        biggestExpense={biggestExpense ? serializePrismaData(biggestExpense) : null}
      />
    </AppShell>
  )
}
