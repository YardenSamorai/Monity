import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { DashboardClient } from './DashboardClient'
import { getMonthRange } from '@/lib/utils'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get current month data
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { start, end } = getMonthRange(currentYear, currentMonth)
  
  // Get accounts
  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  
  // Get monthly transactions
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: start, lte: end },
    },
    include: {
      account: true,
      category: true,
    },
  })
  
  // Get monthly expenses (for the modal)
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
  
  // Get active recurring incomes (for expected monthly income)
  const recurringIncomes = await prisma.recurringIncome.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
  })
  
  // Get active recurring transactions (for expected monthly expenses/income)
  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
  })
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Add recurring incomes that should have been processed this month
  const recurringIncomeAmount = recurringIncomes.reduce((sum, ri) => {
    // Check if this recurring income should have been processed this month
    const shouldBeProcessed = ri.nextRunDate <= end && ri.nextRunDate >= start
    // Or if it's scheduled for this month but hasn't run yet
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
      // For income, check if it should be processed this month
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
  
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Get actual recurring expense transactions (that were created)
  const actualRecurringExpenses = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: 'expense',
      date: { gte: start, lte: end },
      recurringTransactionId: { not: null },
    },
    include: {
      account: true,
      category: true,
      recurringTransaction: true,
    },
  })
  
  // Get recurring expense definitions (to show even if transaction not created yet)
  const recurringExpenseDefinitions = await prisma.recurringTransaction.findMany({
    where: {
      userId: user.id,
      type: 'expense',
      isActive: true,
    },
    include: {
      account: true,
      category: true,
    },
  })
  
  // Get IDs of recurring expenses that already have transactions this month
  const recurringExpenseIdsWithTransactions = new Set(
    actualRecurringExpenses.map(e => e.recurringTransactionId).filter(Boolean)
  )
  
  // Calculate recurring expense amount - only for definitions that DON'T have transactions yet
  // (to avoid double counting: if transaction exists, it's already in totalExpenses)
  const recurringExpenseAmount = recurringExpenseDefinitions
    .filter(re => !recurringExpenseIdsWithTransactions.has(re.id))
    .filter(re => !re.endDate || new Date(re.endDate) >= now)
    .reduce((sum, re) => sum + Number(re.amount), 0)
  
  // Total expenses = actual transactions (which includes recurring transactions that were created)
  // + recurring definitions that haven't created transactions yet (pending)
  const totalExpensesWithRecurring = totalExpenses + recurringExpenseAmount
  
  const netCashFlow = totalIncomeWithRecurring - totalExpensesWithRecurring
  
  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      account: true,
      category: true,
    },
  })
  
  // Total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

  // Get categories for the modal
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { isDefault: true },
      ],
    },
    orderBy: { name: 'asc' },
  })

  return (
    <AppShell>
      <DashboardClient
        totalBalance={totalBalance}
        totalIncome={totalIncomeWithRecurring}
        totalExpenses={totalExpensesWithRecurring}
        netCashFlow={netCashFlow}
        accounts={JSON.parse(JSON.stringify(accounts))}
        recentTransactions={JSON.parse(JSON.stringify(recentTransactions))}
        currentDate={now.toISOString()}
        recurringIncomeAmount={recurringIncomeAmount + recurringTransactionIncomeAmount}
        recurringExpenseAmount={recurringExpenseAmount}
        actualIncome={totalIncome}
        actualExpenses={totalExpenses}
        categories={JSON.parse(JSON.stringify(categories))}
        monthlyExpenses={JSON.parse(JSON.stringify(monthlyExpenses))}
        recurringExpenses={JSON.parse(JSON.stringify(actualRecurringExpenses))}
        recurringExpenseDefinitions={JSON.parse(JSON.stringify(recurringExpenseDefinitions))}
      />
    </AppShell>
  )
}
