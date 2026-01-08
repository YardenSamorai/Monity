import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { DashboardClient } from './DashboardClient'
import { getMonthRange, serializePrismaData } from '@/lib/utils'

// Enable dynamic rendering with caching
export const revalidate = 30 // Revalidate every 30 seconds

export default async function DashboardPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get current month data
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  // Single parallel fetch for all data including onboarding check
  const [
    accounts,
    monthlyTransactions,
    recurringIncomes,
    recurringTransactions,
    recentTransactions,
    categories,
  ] = await Promise.all([
    // Accounts - select only needed fields
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
      },
    }),
    
    // Monthly transactions - select only needed fields
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lte: end },
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        recurringTransactionId: true,
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
    
    // Recurring incomes - select only needed fields
    prisma.recurringIncome.findMany({
      where: { userId: user.id, isActive: true },
      select: {
        id: true,
        amount: true,
        nextRunDate: true,
        lastRunDate: true,
      },
    }),
    
    // Recurring transactions - select only needed fields
    prisma.recurringTransaction.findMany({
      where: { userId: user.id, isActive: true },
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
    
    // Recent transactions
    prisma.transaction.findMany({
      where: { userId: user.id },
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
    
    // Categories - select only needed fields
    prisma.category.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
      },
    }),
  ])
  
  // Check if user needs onboarding (using already fetched accounts)
  if (!user.hasCompletedOnboarding && accounts.length === 0) {
    redirect('/onboarding')
  }
  
  // Process data - derive everything from fetched data
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
  const actualRecurringExpenses = monthlyExpenses.filter(t => t.recurringTransactionId)
  const recurringExpenseDefinitions = recurringTransactions.filter(rt => rt.type === 'expense')
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Add recurring incomes that should have been processed this month
  const recurringIncomeAmount = recurringIncomes.reduce((sum, ri) => {
    const shouldBeProcessed = ri.nextRunDate <= end && ri.nextRunDate >= start
    const scheduledThisMonth = new Date(ri.nextRunDate).getMonth() === now.getMonth() && 
                                new Date(ri.nextRunDate).getFullYear() === now.getFullYear()
    
    if (shouldBeProcessed || scheduledThisMonth || !ri.lastRunDate) {
      return sum + Number(ri.amount)
    }
    return sum
  }, 0)
  
  // Add recurring transaction incomes
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
  
  // Total income includes both actual transactions and expected recurring income
  const totalIncomeWithRecurring = totalIncome + recurringIncomeAmount + recurringTransactionIncomeAmount
  
  const totalExpenses = monthlyExpenses.reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Get IDs of recurring expenses that already have transactions this month
  const recurringExpenseIdsWithTransactions = new Set(
    actualRecurringExpenses.map(e => e.recurringTransactionId).filter(Boolean)
  )
  
  // Calculate recurring expense amount - only for definitions that DON'T have transactions yet
  const recurringExpenseAmount = recurringExpenseDefinitions
    .filter(re => !recurringExpenseIdsWithTransactions.has(re.id))
    .filter(re => !re.endDate || new Date(re.endDate) >= now)
    .reduce((sum, re) => sum + Number(re.amount), 0)
  
  // Total expenses = actual transactions + recurring definitions that haven't created transactions yet
  const totalExpensesWithRecurring = totalExpenses + recurringExpenseAmount
  
  const netCashFlow = totalIncomeWithRecurring - totalExpensesWithRecurring
  
  // Total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

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
      />
    </AppShell>
  )
}
