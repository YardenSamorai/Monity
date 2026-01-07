import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateTransactionSchema } from '@/lib/validations'

// GET /api/transactions/[id] - Get single transaction
export async function GET(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      include: {
        account: true,
        category: true,
      },
    })
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

// PATCH /api/transactions/[id] - Update transaction
export async function PATCH(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const validated = updateTransactionSchema.parse({ ...body, id })
    
    // Revert old balance change
    const oldBalanceChange = existing.type === 'income' 
      ? -Number(existing.amount) 
      : Number(existing.amount)
    
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: oldBalanceChange } },
    })
    
    // Apply new balance change
    const newAmount = validated.amount !== undefined ? validated.amount : Number(existing.amount)
    const newType = validated.type !== undefined ? validated.type : existing.type
    const newBalanceChange = newType === 'income' ? newAmount : -newAmount
    
    const updateData = {}
    if (validated.accountId !== undefined) updateData.accountId = validated.accountId
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.amount !== undefined) updateData.amount = validated.amount
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.date !== undefined) updateData.date = new Date(validated.date)
    if (validated.notes !== undefined) updateData.notes = validated.notes
    
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        category: true,
      },
    })
    
    // Update account balance with new change
    const accountId = validated.accountId || existing.accountId
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: newBalanceChange } },
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'transaction.updated',
        entityType: 'Transaction',
        entityId: transaction.id,
      },
    })
    
    return NextResponse.json({ transaction })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      include: {
        account: true,
      },
    })
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // Handle transfer transactions differently
    if (transaction.type === 'transfer' && transaction.transferToAccountId) {
      // For transfers, we need to revert both sides
      // The transaction itself reduces the source account
      // The linked transaction increases the destination account
      
      // Revert source account (add back the amount)
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: Number(transaction.amount) } },
      })
      
      // Find and revert destination account if transferToTransactionId exists
      if (transaction.transferToTransactionId) {
        const toTransaction = await prisma.transaction.findFirst({
          where: { id: transaction.transferToTransactionId, userId: user.id },
        })
        
        if (toTransaction) {
          // Revert destination account (subtract the amount)
          await prisma.account.update({
            where: { id: transaction.transferToAccountId },
            data: { balance: { decrement: Number(transaction.amount) } },
          })
          
          // Delete the destination transaction too
          await prisma.transaction.delete({
            where: { id: transaction.transferToTransactionId },
          })
        }
      } else {
        // If no linked transaction, just revert the destination account
        await prisma.account.update({
          where: { id: transaction.transferToAccountId },
          data: { balance: { decrement: Number(transaction.amount) } },
        })
      }
    } else {
      // Regular income/expense transaction
      // Revert balance change
      const balanceChange = transaction.type === 'income' 
        ? -Number(transaction.amount) 
        : Number(transaction.amount)
      
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      })
    }
    
    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'transaction.deleted',
        entityType: 'Transaction',
        entityId: id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

