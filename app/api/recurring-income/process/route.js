import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyCron(request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

async function processRecurringIncomes() {
  const now = new Date()
  const pendingIncomes = await prisma.recurringIncome.findMany({
    where: {
      isActive: true,
      nextRunDate: { lte: now },
    },
    include: { account: true, category: true },
  })

  const results = []

  for (const income of pendingIncomes) {
    try {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: income.userId,
          recurringIncomeId: income.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      })

      if (existingTransaction) {
        const nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(income.dayOfMonth)
        await prisma.recurringIncome.update({
          where: { id: income.id },
          data: { lastRunDate: now, nextRunDate },
        })
        results.push({ recurringIncomeId: income.id, status: 'skipped_duplicate' })
        continue
      }

      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), income.dayOfMonth)

      const transaction = await prisma.transaction.create({
        data: {
          userId: income.userId,
          accountId: income.accountId,
          categoryId: income.categoryId,
          type: 'income',
          amount: income.amount,
          description: income.description,
          date: scheduledDate,
          notes: 'Automatic recurring income',
          recurringIncomeId: income.id,
          householdId: income.householdId,
          isShared: income.isShared,
        },
      })

      await prisma.account.update({
        where: { id: income.accountId },
        data: { balance: { increment: income.amount } },
      })

      const nextRunDate = new Date(now)
      nextRunDate.setMonth(nextRunDate.getMonth() + 1)
      nextRunDate.setDate(income.dayOfMonth)

      await prisma.recurringIncome.update({
        where: { id: income.id },
        data: { lastRunDate: now, nextRunDate },
      })

      results.push({
        recurringIncomeId: income.id,
        transactionId: transaction.id,
        status: 'success',
      })
    } catch (error) {
      console.error(`Error processing recurring income ${income.id}:`, error)
      results.push({
        recurringIncomeId: income.id,
        status: 'error',
        error: error.message,
      })
    }
  }

  return { processed: results.length, results }
}

// GET /api/recurring-income/process - Called by Vercel cron
export async function GET(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processRecurringIncomes()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing recurring incomes:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring incomes', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recurring-income/process - Manual trigger
export async function POST(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processRecurringIncomes()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing recurring incomes:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring incomes', details: error.message },
      { status: 500 }
    )
  }
}

