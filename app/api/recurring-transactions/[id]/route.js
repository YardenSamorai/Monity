import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyRecurringTransactionChange, notifyDashboardUpdate } from '@/lib/pusher'

// PUT /api/recurring-transactions/[id] - Update recurring transaction
export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { type, amount, description, accountId, categoryId, dayOfMonth, endDate, isActive } = body

    // Validate
    if (type && type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Type must be "income" or "expense"' },
        { status: 400 }
      )
    }

    if (dayOfMonth !== undefined && (dayOfMonth < 1 || dayOfMonth > 28)) {
      return NextResponse.json(
        { error: 'Day of month must be between 1 and 28' },
        { status: 400 }
      )
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring transaction not found' },
        { status: 404 }
      )
    }

    // Verify account belongs to user if changed
    if (accountId && accountId !== existing.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: user.id },
      })

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
    }

    // Calculate next run date if day of month changed
    let nextRunDate = existing.nextRunDate
    if (dayOfMonth !== undefined && dayOfMonth !== existing.dayOfMonth) {
      const now = new Date()
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
      
      if (currentMonthDate < now) {
        nextRunDate = nextMonthDate
      } else {
        nextRunDate = currentMonthDate
      }
    }

    // Check if endDate is in the past
    if (endDate !== undefined && endDate !== null && new Date(endDate) < new Date()) {
      return NextResponse.json(
        { error: 'End date cannot be in the past' },
        { status: 400 }
      )
    }

    const updateData = {}
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) updateData.amount = amount
    if (description !== undefined) updateData.description = description
    if (accountId !== undefined) updateData.accountId = accountId
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (dayOfMonth !== undefined) {
      updateData.dayOfMonth = dayOfMonth
      updateData.nextRunDate = nextRunDate
    }
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const recurringTransaction = await prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        category: true,
      },
    })

    // Invalidate dashboard cache and notify
    revalidateTag('dashboard')
    revalidateTag('recurring-transactions')
    notifyRecurringTransactionChange(user.id, 'updated', recurringTransaction).catch(() => {})
    notifyDashboardUpdate(user.id, { action: 'recurring_transaction_updated' }).catch(() => {})

    return NextResponse.json({ recurringTransaction })
  } catch (error) {
    console.error('Error updating recurring transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring-transactions/[id] - Delete recurring transaction
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const deleteTransactions = searchParams.get('deleteTransactions') === 'true'

    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!recurringTransaction) {
      return NextResponse.json(
        { error: 'Recurring transaction not found' },
        { status: 404 }
      )
    }

    // Find all transactions created from this recurring transaction
    const relatedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        recurringTransactionId: id,
      },
    })

    // If deleteTransactions is true, delete all related transactions and update account balances
    if (deleteTransactions && relatedTransactions.length > 0) {
      for (const transaction of relatedTransactions) {
        // Update account balance (reverse the transaction)
        const balanceChange = transaction.type === 'income' 
          ? -Number(transaction.amount) 
          : Number(transaction.amount)
        
        await prisma.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        })
        
        // Delete transaction
        await prisma.transaction.delete({
          where: { id: transaction.id },
        })
      }
    }

    // Delete the recurring transaction
    await prisma.recurringTransaction.delete({
      where: { id },
    })

    // Invalidate dashboard cache and notify
    revalidateTag('dashboard')
    revalidateTag('recurring-transactions')
    revalidateTag('transactions')
    notifyRecurringTransactionChange(user.id, 'deleted', { id }).catch(() => {})
    notifyDashboardUpdate(user.id, { action: 'recurring_transaction_deleted' }).catch(() => {})

    return NextResponse.json({ 
      success: true,
      deletedTransactions: deleteTransactions ? relatedTransactions.length : 0,
    })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring transaction' },
      { status: 500 }
    )
  }
}

