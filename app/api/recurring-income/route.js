import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyRecurringIncomeChange, notifyDashboardUpdate } from '@/lib/pusher'

// GET /api/recurring-income - List recurring incomes
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    const where = { userId: user.id }
    if (householdId) {
      // Verify user is member of household
      const member = await prisma.householdMember.findFirst({
        where: { userId: user.id, householdId },
      })
      if (member) {
        where.householdId = householdId
        where.isShared = true
      }
    } else {
      where.isShared = false
    }

    const recurringIncomes = await prisma.recurringIncome.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringIncomes })
  } catch (error) {
    console.error('Error fetching recurring incomes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring incomes' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-income - Create recurring income
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, description, accountId, categoryId, dayOfMonth, householdId, isShared } = body

    // Validate
    if (!amount || !description || !accountId || !dayOfMonth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify household if shared
    let verifiedHouseholdId = null
    if (isShared && householdId) {
      const member = await prisma.householdMember.findFirst({
        where: { userId: user.id, householdId },
      })
      if (member) {
        verifiedHouseholdId = householdId
      }
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

    const recurringIncome = await prisma.recurringIncome.create({
      data: {
        userId: user.id,
        accountId,
        categoryId,
        amount,
        description,
        dayOfMonth,
        nextRunDate,
        householdId: verifiedHouseholdId,
        isShared: verifiedHouseholdId ? true : false,
      },
      include: {
        account: true,
        category: true,
      },
    })

    // If we should create a transaction for the current month (day already passed)
    if (shouldCreateTransactionNow) {
      try {
        // Create transaction for current month
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            accountId,
            categoryId,
            type: 'income',
            amount,
            description,
            date: currentMonthDate, // Use the day of month, not today
            notes: `Automatic recurring income`,
            recurringIncomeId: recurringIncome.id,
            householdId: verifiedHouseholdId,
            isShared: verifiedHouseholdId ? true : false,
          },
        })

        // Update account balance
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        })

        // Update recurring income with last run date
        await prisma.recurringIncome.update({
          where: { id: recurringIncome.id },
          data: {
            lastRunDate: currentMonthDate,
          },
        })
      } catch (error) {
        console.error('Error creating initial transaction for recurring income:', error)
        // Don't fail the whole request if transaction creation fails
      }
    }

    // Revalidate cache and notify
    revalidateTag('recurring-income')
    revalidateTag('dashboard')
    notifyRecurringIncomeChange(user.clerkUserId, 'created', recurringIncome).catch((err) => console.error('Pusher error:', err))
    notifyDashboardUpdate(user.clerkUserId, { action: 'recurring_income_created' }).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ recurringIncome }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring income:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring income' },
      { status: 500 }
    )
  }
}

