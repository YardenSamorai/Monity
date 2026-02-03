import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyRecurringTransactionChange, notifyDashboardUpdate } from '@/lib/pusher'

// GET /api/recurring-transactions - List recurring transactions
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'income' or 'expense' or null for all

    const where = { userId: user.id }
    if (type) {
      where.type = type
    }

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringTransactions })
  } catch (error) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring transactions' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-transactions - Create recurring transaction
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, amount, description, accountId, categoryId, dayOfMonth, endDate } = body

    // Validate
    if (!type || !amount || !description || !accountId || !dayOfMonth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Type must be "income" or "expense"' },
        { status: 400 }
      )
    }

    if (dayOfMonth < 1 || dayOfMonth > 28) {
      return NextResponse.json(
        { error: 'Day of month must be between 1 and 28' },
        { status: 400 }
      )
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Calculate next run date
    const now = new Date()
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
    
    let nextRunDate
    let shouldCreateTransactionNow = false
    
    // If the day has already passed this month, schedule for next month
    if (currentMonthDate < now) {
      nextRunDate = nextMonthDate
      // But also create a transaction for the current month if it's the first time setting up
      shouldCreateTransactionNow = true
    } else {
      nextRunDate = currentMonthDate
    }

    // Check if endDate is in the past
    if (endDate && new Date(endDate) < now) {
      return NextResponse.json(
        { error: 'End date cannot be in the past' },
        { status: 400 }
      )
    }

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        userId: user.id,
        accountId,
        categoryId: categoryId || null,
        type,
        amount,
        description,
        dayOfMonth,
        nextRunDate,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        account: true,
        category: true,
      },
    })

    // For expenses: always create a transaction immediately so user can see the impact
    // For income: only create if day has passed (to match recurring income behavior)
    const shouldCreateNow = type === 'expense' || shouldCreateTransactionNow
    
    // Check if we should create transaction now
    // For expenses: always create immediately (unless endDate is in the past)
    // For income: only if day has passed
    // Also check endDate is not in the past
    const endDateObj = endDate ? new Date(endDate) : null
    const endDateInPast = endDateObj && endDateObj < now
    const shouldCreate = shouldCreateNow && !endDateInPast
    
    console.log(`[Recurring Transaction] type=${type}, shouldCreateNow=${shouldCreateNow}, endDate=${endDateObj}, endDateInPast=${endDateInPast}, shouldCreate=${shouldCreate}`)
    
    if (shouldCreate) {
      try {
        // Use today's date for expenses (immediate impact), or currentMonthDate for income
        const transactionDate = type === 'expense' ? now : currentMonthDate
        
        // Check if transaction already exists for this month (prevent duplicates)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: user.id,
            recurringTransactionId: recurringTransaction.id,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        })

        if (existingTransaction) {
          // Transaction already exists, skip creation
          console.log(`Transaction already exists for recurring transaction ${recurringTransaction.id} this month`)
        } else {
          // Create transaction for current month
          const transaction = await prisma.transaction.create({
            data: {
              userId: user.id,
              accountId,
              categoryId: categoryId || null,
              type,
              amount,
              description,
              date: transactionDate,
              notes: `Automatic recurring ${type}`,
              recurringTransactionId: recurringTransaction.id,
            },
          })

          // Update account balance
          const balanceChange = type === 'income' ? amount : -amount
          await prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: balanceChange } },
          })

          // Update recurring transaction with last run date
          await prisma.recurringTransaction.update({
            where: { id: recurringTransaction.id },
            data: {
              lastRunDate: transactionDate,
            },
          })
          
          console.log(`Created initial transaction for recurring ${type}: ${transaction.id}`)
        }
      } catch (error) {
        console.error('Error creating initial transaction for recurring transaction:', error)
        // Don't fail the whole request if transaction creation fails, but log it
        console.error('Error details:', {
          recurringTransactionId: recurringTransaction.id,
          type,
          accountId,
          error: error.message,
          stack: error.stack,
        })
      }
    } else {
      console.log(`Skipping transaction creation for recurring ${type}: shouldCreateNow=${shouldCreateNow}, endDate=${endDateObj}`)
    }

    // Revalidate cache and notify
    revalidateTag('recurring-transactions')
    revalidateTag('dashboard')
    notifyRecurringTransactionChange(user.clerkUserId, 'created', recurringTransaction).catch((err) => console.error('Pusher error:', err))
    notifyDashboardUpdate(user.clerkUserId, { action: 'recurring_transaction_created' }).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ recurringTransaction }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring transaction' },
      { status: 500 }
    )
  }
}

