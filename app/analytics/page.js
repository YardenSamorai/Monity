import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { AnalyticsClient } from './AnalyticsClient'
import { serializePrismaData } from '@/lib/utils'

export const revalidate = 60

export default async function AnalyticsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Get current date info
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Get first and last day of current month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
  
  // Get first and last day of previous month
  const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1)
  const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)
  
  // Get first day of 6 months ago for trend data
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1)
  
  // Fetch all data in parallel using Promise.all with optimized select
  const [
    transactions,
    budgets,
    recurringTransactions,
    recurringIncomes,
    categories,
  ] = await Promise.all([
    // Fetch transactions for the last 6 months - select only needed fields
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo },
      },
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        categoryId: true,
        recurringTransactionId: true,
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: 'asc' },
    }),
    
    // Fetch budgets for current month
    prisma.budget.findMany({
      where: {
        userId: user.id,
        month: currentMonth + 1,
        year: currentYear,
      },
      select: {
        id: true,
        amount: true,
        categoryId: true,
        category: { select: { id: true, name: true, color: true } },
      },
    }),
    
    // Fetch recurring transactions
    prisma.recurringTransaction.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        categoryId: true,
        category: { select: { id: true, name: true, color: true } },
      },
    }),
    
    // Fetch recurring incomes count
    prisma.recurringIncome.count({
      where: {
        userId: user.id,
        isActive: true,
      },
    }),
    
    // Fetch categories
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      select: { id: true, name: true, type: true, color: true, icon: true },
    }),
  ])
  
  // Calculate current month stats
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date >= startOfMonth && date <= endOfMonth
  })
  
  const prevMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date >= startOfPrevMonth && date <= endOfPrevMonth
  })
  
  // Current month totals
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Previous month totals
  const prevMonthIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const prevMonthExpenses = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Calculate expense by category for current month
  const expensesByCategory = {}
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catId = t.categoryId || 'uncategorized'
      const catName = t.category?.name || null // null means uncategorized - will be translated on client
      const catColor = t.category?.color || '#6B7280'
      
      if (!expensesByCategory[catId]) {
        expensesByCategory[catId] = {
          id: catId,
          name: catName,
          color: catColor,
          amount: 0,
          count: 0,
          isUncategorized: !t.categoryId,
        }
      }
      expensesByCategory[catId].amount += Number(t.amount)
      expensesByCategory[catId].count += 1
    })
  
  // Same for previous month
  const prevExpensesByCategory = {}
  prevMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catId = t.categoryId || 'uncategorized'
      if (!prevExpensesByCategory[catId]) {
        prevExpensesByCategory[catId] = { amount: 0 }
      }
      prevExpensesByCategory[catId].amount += Number(t.amount)
    })
  
  // Calculate monthly trends (last 6 months)
  const monthlyTrends = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(currentYear, currentMonth - i, 1)
    const monthEnd = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59)
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date >= monthStart && date <= monthEnd
    })
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    monthlyTrends.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      monthNum: monthStart.getMonth(),
      year: monthStart.getFullYear(),
      income,
      expenses,
      net: income - expenses,
    })
  }
  
  // Calculate daily spending for current month
  const dailySpending = []
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(currentYear, currentMonth, day)
    const dayEnd = new Date(currentYear, currentMonth, day, 23, 59, 59)
    
    const dayExpenses = currentMonthTransactions
      .filter(t => {
        const date = new Date(t.date)
        return date >= dayStart && date <= dayEnd && t.type === 'expense'
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    dailySpending.push({
      day,
      date: dayStart.toISOString(),
      amount: dayExpenses,
    })
  }
  
  // Calculate spending by day of week
  const spendingByDayOfWeek = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
  const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]
  
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const dayOfWeek = new Date(t.date).getDay()
      spendingByDayOfWeek[dayOfWeek] += Number(t.amount)
      countByDayOfWeek[dayOfWeek] += 1
    })
  
  // Total budget
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  
  // Calculate budget usage per category
  const budgetUsage = budgets.map(budget => {
    const spent = expensesByCategory[budget.categoryId]?.amount || 0
    const budgetAmount = Number(budget.amount)
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category?.name || null, // null means uncategorized - will be translated on client
      categoryColor: budget.category?.color || '#6B7280',
      isUncategorized: !budget.categoryId,
      budget: budgetAmount,
      spent,
      remaining: budgetAmount - spent,
      percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
    }
  })
  
  // Identify fixed vs variable expenses based on user-defined recurring expenses
  const recurringExpensesList = recurringTransactions.filter(rt => rt.type === 'expense')
  
  // Fixed expenses = recurring expenses defined by user
  const fixedExpenses = recurringExpensesList.map(re => ({
    id: re.id,
    name: re.description,
    amount: Number(re.amount),
    color: re.category?.color || '#6B7280',
    categoryName: re.category?.name || null,
    isUncategorized: !re.categoryId,
  }))
  
  // Variable expenses = all expenses that are NOT from recurring transactions
  // Get IDs of transactions that came from recurring expenses
  const recurringTransactionIds = new Set(
    currentMonthTransactions
      .filter(t => t.recurringTransactionId)
      .map(t => t.recurringTransactionId)
  )
  
  // Variable = expenses that don't have a recurringTransactionId
  const variableTransactions = currentMonthTransactions.filter(t => 
    t.type === 'expense' && !t.recurringTransactionId
  )
  
  // Group variable expenses by category
  const variableByCategory = {}
  variableTransactions.forEach(t => {
    const catId = t.categoryId || 'uncategorized'
    const catName = t.category?.name || null
    const catColor = t.category?.color || '#6B7280'
    
    if (!variableByCategory[catId]) {
      variableByCategory[catId] = {
        id: catId,
        name: catName,
        color: catColor,
        amount: 0,
        count: 0,
        isUncategorized: !t.categoryId,
      }
    }
    variableByCategory[catId].amount += Number(t.amount)
    variableByCategory[catId].count += 1
  })
  
  const variableExpenses = Object.values(variableByCategory)
  
  // Get top spending category
  const sortedCategories = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount)
  const topCategory = sortedCategories[0] || null
  
  // Find the most expensive day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const maxDayIndex = spendingByDayOfWeek.indexOf(Math.max(...spendingByDayOfWeek))
  const mostExpensiveDay = {
    name: dayNames[maxDayIndex],
    index: maxDayIndex,
    amount: spendingByDayOfWeek[maxDayIndex],
  }

  return (
    <AppShell>
      <AnalyticsClient
        currentDate={now.toISOString()}
        currentMonthIncome={currentMonthIncome}
        currentMonthExpenses={currentMonthExpenses}
        prevMonthIncome={prevMonthIncome}
        prevMonthExpenses={prevMonthExpenses}
        expensesByCategory={serializePrismaData(Object.values(expensesByCategory))}
        prevExpensesByCategory={serializePrismaData(prevExpensesByCategory)}
        monthlyTrends={monthlyTrends}
        dailySpending={dailySpending}
        spendingByDayOfWeek={spendingByDayOfWeek}
        totalBudget={totalBudget}
        budgetUsage={serializePrismaData(budgetUsage)}
        fixedExpenses={serializePrismaData(fixedExpenses)}
        variableExpenses={serializePrismaData(variableExpenses)}
        topCategory={topCategory ? serializePrismaData(topCategory) : null}
        mostExpensiveDay={mostExpensiveDay}
        categories={serializePrismaData(categories)}
        recurringExpenses={recurringTransactions.filter(rt => rt.type === 'expense').length}
        recurringIncome={recurringIncomes}
      />
    </AppShell>
  )
}
