import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/recurring-transactions/process - Process pending recurring transactions
// This should be called by a cron job daily
export async function POST(request) {
  try {
    // Verify this is called from a cron job (optional: add auth token)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Find all active recurring transactions that are due and not past end date
    const pendingTransactions = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: {
        account: true,
        category: true,
      },
    })

    const results = []

    for (const recurring of pendingTransactions) {
      try {
        // Check if end date has passed
        if (recurring.endDate && new Date(recurring.endDate) < now) {
          // Deactivate instead of creating transaction
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { isActive: false },
          })
          continue
        }

        // Check if transaction already exists for this month (prevent duplicates)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: recurring.userId,
            recurringTransactionId: recurring.id,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        })

        if (existingTransaction) {
          // Transaction already exists for this month, skip and update nextRunDate
          let nextRunDate = new Date(now)
          nextRunDate.setMonth(nextRunDate.getMonth() + 1)
          nextRunDate.setDate(recurring.dayOfMonth)

          if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
            await prisma.recurringTransaction.update({
              where: { id: recurring.id },
              data: {
                lastRunDate: now,
                isActive: false,
              },
            })
          } else {
            await prisma.recurringTransaction.update({
              where: { id: recurring.id },
              data: {
                lastRunDate: now,
                nextRunDate: nextRunDate,
              },
            })
          }
          continue
        }

        // Create transaction
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

        // Update account balance
        const balanceChange = recurring.type === 'income' 
          ? recurring.amount 
          : -recurring.amount
        
        await prisma.account.update({
          where: { id: recurring.accountId },
          data: { balance: { increment: balanceChange } },
        })

        // Calculate next run date (same day next month)
        let nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(recurring.dayOfMonth)

        // If next run date would be after end date, deactivate
        if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: {
              lastRunDate: now,
              isActive: false,
            },
          })
        } else {
          // Update recurring transaction
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: {
              lastRunDate: now,
              nextRunDate: nextRunDate,
            },
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

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring transactions' },
      { status: 500 }
    )
  }
}

