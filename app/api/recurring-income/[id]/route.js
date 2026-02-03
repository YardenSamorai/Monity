import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyRecurringIncomeChange, notifyDashboardUpdate } from '@/lib/pusher'

// PUT /api/recurring-income/[id] - Update recurring income
export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { amount, description, accountId, categoryId, dayOfMonth } = body

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

    const existing = await prisma.recurringIncome.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring income not found' },
        { status: 404 }
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

    // Calculate next run date if day of month changed
    let nextRunDate = existing.nextRunDate
    if (dayOfMonth !== existing.dayOfMonth) {
      const now = new Date()
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
      
      if (currentMonthDate < now) {
        nextRunDate = nextMonthDate
      } else {
        nextRunDate = currentMonthDate
      }
    }

    const recurringIncome = await prisma.recurringIncome.update({
      where: { id },
      data: {
        amount,
        description,
        accountId,
        categoryId: categoryId || null,
        dayOfMonth,
        nextRunDate,
      },
      include: {
        account: true,
        category: true,
      },
    })

    // Revalidate cache and notify
    revalidateTag('recurring-income')
    revalidateTag('dashboard')
    notifyRecurringIncomeChange(user.id, 'updated', recurringIncome).catch(() => {})
    notifyDashboardUpdate(user.id, { action: 'recurring_income_updated' }).catch(() => {})

    return NextResponse.json({ recurringIncome })
  } catch (error) {
    console.error('Error updating recurring income:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring income' },
      { status: 500 }
    )
  }
}

// PATCH /api/recurring-income/[id] - Toggle active status
export async function PATCH(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.recurringIncome.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring income not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    const recurringIncome = await prisma.recurringIncome.update({
      where: { id },
      data: { isActive },
      include: {
        account: true,
        category: true,
      },
    })

    // Revalidate cache and notify
    revalidateTag('recurring-income')
    revalidateTag('dashboard')
    notifyRecurringIncomeChange(user.id, 'updated', recurringIncome).catch(() => {})
    notifyDashboardUpdate(user.id, { action: 'recurring_income_toggled' }).catch(() => {})

    return NextResponse.json({ recurringIncome })
  } catch (error) {
    console.error('Error updating recurring income:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring income' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring-income/[id] - Delete recurring income
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const deleteTransactions = searchParams.get('deleteTransactions') === 'true'

    const recurringIncome = await prisma.recurringIncome.findFirst({
      where: { id, userId: user.id },
    })

    if (!recurringIncome) {
      return NextResponse.json(
        { error: 'Recurring income not found' },
        { status: 404 }
      )
    }

    // Find all transactions created from this recurring income
    const relatedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        recurringIncomeId: id,
      },
    })

    // If deleteTransactions is true, delete all related transactions and update account balances
    if (deleteTransactions && relatedTransactions.length > 0) {
      for (const transaction of relatedTransactions) {
        // Decrement account balance
        await prisma.account.update({
          where: { id: transaction.accountId },
          data: { balance: { decrement: transaction.amount } },
        })
        
        // Delete transaction
        await prisma.transaction.delete({
          where: { id: transaction.id },
        })
      }
    }

    // Delete the recurring income
    await prisma.recurringIncome.delete({
      where: { id },
    })

    // Revalidate cache and notify
    revalidateTag('recurring-income')
    revalidateTag('dashboard')
    revalidateTag('transactions')
    notifyRecurringIncomeChange(user.id, 'deleted', { id }).catch(() => {})
    notifyDashboardUpdate(user.id, { action: 'recurring_income_deleted' }).catch(() => {})

    return NextResponse.json({ 
      success: true,
      deletedTransactions: deleteTransactions ? relatedTransactions.length : 0,
    })
  } catch (error) {
    console.error('Error deleting recurring income:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring income' },
      { status: 500 }
    )
  }
}

