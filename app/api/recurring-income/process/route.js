import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/recurring-income/process - Process pending recurring incomes
// This should be called by a cron job daily
export async function POST(request) {
  try {
    // Verify this is called from a cron job (optional: add auth token)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Find all active recurring incomes that are due
    const pendingIncomes = await prisma.recurringIncome.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
      },
      include: {
        account: true,
        category: true,
      },
    })

    const results = []

    for (const income of pendingIncomes) {
      try {
        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: income.userId,
            accountId: income.accountId,
            categoryId: income.categoryId,
            type: 'income',
            amount: income.amount,
            description: income.description,
            date: now,
            notes: `Automatic recurring income`,
            recurringIncomeId: income.id,
          },
        })

        // Update account balance
        await prisma.account.update({
          where: { id: income.accountId },
          data: { balance: { increment: income.amount } },
        })

        // Calculate next run date (same day next month)
        const nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(income.dayOfMonth)

        // Update recurring income
        await prisma.recurringIncome.update({
          where: { id: income.id },
          data: {
            lastRunDate: now,
            nextRunDate: nextRunDate,
          },
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

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Error processing recurring incomes:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring incomes' },
      { status: 500 }
    )
  }
}

