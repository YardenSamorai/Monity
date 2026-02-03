import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { DashboardClient } from './DashboardClient'
import { getMonthRange, serializePrismaData } from '@/lib/utils'
import { unstable_cache } from 'next/cache'

// Revalidate every 5 seconds for more responsive updates
export const revalidate = 5

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
      goals,
      creditCardTransactions,
      recentCreditCardTransactions,
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
        take: 10, // Get more to merge with CC transactions
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
      // Active savings goals
      prisma.savingsGoal.findMany({
        where: {
          userId,
          isCompleted: false,
          isPaused: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          targetDate: true,
          icon: true,
          priority: true,
        },
      }),
      // Credit card transactions for current month
      prisma.creditCardTransaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          description: true,
          date: true,
          status: true,
          categoryId: true,
          creditCard: { select: { id: true, name: true, lastFourDigits: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      }),
      // Recent credit card transactions (for "recent transactions" widget)
      prisma.creditCardTransaction.findMany({
        where: { userId },
        take: 10,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          amount: true,
          description: true,
          date: true,
          status: true,
          creditCard: { select: { id: true, name: true, lastFourDigits: true } },
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
      goals,
      creditCardTransactions,
      recentCreditCardTransactions,
      fetchedAt: now.toISOString(),
    }
  },
  ['dashboard-data'],
  { revalidate: 5, tags: ['dashboard'] }
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
    goals,
    creditCardTransactions,
    recentCreditCardTransactions,
  } = await getDashboardData(user.id)
  
  // Check if user needs onboarding
  if (!user.hasCompletedOnboarding && accounts.length === 0) {
    redirect('/onboarding')
  }
  
  // Process data
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
  
  // Transform credit card transactions to look like regular expenses for calculations
  const ccExpenses = (creditCardTransactions || []).map(cc => ({
    id: cc.id,
    type: 'expense',
    amount: cc.amount,
    description: cc.description,
    date: cc.date,
    categoryId: cc.categoryId,
    category: cc.category,
    isCreditCard: true,
    creditCardStatus: cc.status,
  }))
  
  // Combine regular expenses with credit card expenses
  const allMonthlyExpenses = [...monthlyExpenses, ...ccExpenses]
  
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
  const totalExpenses = allMonthlyExpenses.reduce((sum, t) => sum + Number(t.amount), 0)
  
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
  
  // Calculate spending by category (including credit card transactions)
  const spendingByCategory = {}
  allMonthlyExpenses.forEach(t => {
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
  
  // Calculate budget alerts (including credit card transactions)
  const budgetAlerts = budgets.map(budget => {
    const spent = allMonthlyExpenses
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
  
  // Find biggest expense (including credit card transactions)
  const biggestExpense = allMonthlyExpenses.length > 0
    ? allMonthlyExpenses.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max, allMonthlyExpenses[0])
    : null

  // Card type names for display
  const CARD_TYPE_NAMES = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    diners: 'Diners',
    discover: 'Discover',
    isracard: 'Isracard',
    cal: 'Cal',
    max: 'Max',
    other: 'Card',
  }

  // Merge recent transactions with recent credit card transactions
  const recentCCTransformed = (recentCreditCardTransactions || []).map(cc => ({
    id: cc.id,
    type: 'expense',
    amount: cc.amount,
    description: cc.description,
    date: cc.date,
    isCreditCard: true,
    creditCardStatus: cc.status,
    account: {
      id: cc.creditCard.id,
      name: `${CARD_TYPE_NAMES[cc.creditCard.name] || cc.creditCard.name} •••• ${cc.creditCard.lastFourDigits}`,
      type: 'credit',
    },
    category: cc.category,
  }))

  const allRecentTransactions = [...recentTransactions, ...recentCCTransformed]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <AppShell>
      <DashboardClient
        totalBalance={totalBalance}
        totalIncome={totalIncomeWithRecurring}
        totalExpenses={totalExpensesWithRecurring}
        netCashFlow={netCashFlow}
        accounts={serializePrismaData(accounts)}
        recentTransactions={serializePrismaData(allRecentTransactions)}
        currentDate={now.toISOString()}
        recurringIncomeAmount={recurringIncomeAmount + recurringTransactionIncomeAmount}
        recurringExpenseAmount={recurringExpenseAmount}
        actualIncome={totalIncome}
        actualExpenses={totalExpenses}
        categories={serializePrismaData(categories)}
        monthlyExpenses={serializePrismaData(allMonthlyExpenses)}
        recurringExpenses={serializePrismaData(actualRecurringExpenses)}
        recurringExpenseDefinitions={serializePrismaData(recurringExpenseDefinitions)}
        // Insights data
        lastMonthExpenses={lastMonthExpenses}
        topCategories={topCategories}
        budgetAlerts={budgetAlerts}
        biggestExpense={biggestExpense ? serializePrismaData(biggestExpense) : null}
        // Goals
        goals={serializePrismaData(goals)}
      />
    </AppShell>
  )
}
