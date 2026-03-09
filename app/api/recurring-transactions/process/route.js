import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyCron(request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

async function processRecurringTransactions() {
  const now = new Date()
  const pendingTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { account: true, category: true },
  })

  const results = []

  for (const recurring of pendingTransactions) {
    try {
      if (recurring.endDate && new Date(recurring.endDate) < now) {
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { isActive: false },
        })
        continue
      }

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: recurring.userId,
          recurringTransactionId: recurring.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      })

      if (existingTransaction) {
        let nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(recurring.dayOfMonth)

        if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { lastRunDate: now, isActive: false },
          })
        } else {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { lastRunDate: now, nextRunDate },
          })
        }
        results.push({ recurringTransactionId: recurring.id, status: 'skipped_duplicate' })
        continue
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: recurring.userId,
          accountId: recurring.accountId,
          categoryId: recurring.categoryId,
          type: recurring.type,
          amount: recurring.amount,
          description: recurring.description,
          date: now,
          notes: `Automatic recurring ${recurring.type}`,
          recurringTransactionId: recurring.id,
          householdId: recurring.householdId,
          isShared: recurring.isShared,
        },
      })

      const balanceChange = recurring.type === 'income' ? recurring.amount : -recurring.amount
      await prisma.account.update({
        where: { id: recurring.accountId },
        data: { balance: { increment: balanceChange } },
      })

      let nextRunDate = new Date(now)
      nextRunDate.setMonth(nextRunDate.getMonth() + 1)
      nextRunDate.setDate(recurring.dayOfMonth)

      if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { lastRunDate: now, isActive: false },
        })
      } else {
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { lastRunDate: now, nextRunDate },
        })
      }

      results.push({
        recurringTransactionId: recurring.id,
        transactionId: transaction.id,
        status: 'success',
      })
    } catch (error) {
      console.error(`Error processing recurring transaction ${recurring.id}:`, error)
      results.push({
        recurringTransactionId: recurring.id,
        status: 'error',
        error: error.message,
      })
    }
  }

  return { processed: results.length, results }
}

// GET /api/recurring-transactions/process - Called by Vercel cron
export async function GET(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processRecurringTransactions()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring transactions', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recurring-transactions/process - Manual trigger
export async function POST(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processRecurringTransactions()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring transactions', details: error.message },
      { status: 500 }
    )
  }
}

