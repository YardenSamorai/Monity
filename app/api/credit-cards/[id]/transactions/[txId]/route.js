import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/credit-cards/[id]/transactions/[txId] - Delete a credit card transaction
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, txId } = await params

    // Verify card ownership
    const card = await prisma.creditCard.findFirst({
      where: { id, userId: user.id },
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }

    // Get user's household IDs for shared transactions
    const householdIds = await prisma.householdMember.findMany({
      where: { userId: user.id },
      select: { householdId: true },
    }).then(members => members.map(m => m.householdId))

    // Verify transaction exists and belongs to this card
    // Allow deletion if: user owns the transaction OR it's a shared transaction in user's household
    const transaction = await prisma.creditCardTransaction.findFirst({
      where: { 
        id: txId, 
        creditCardId: id,
        OR: [
          { userId: user.id },
          { isShared: true, householdId: { in: householdIds } },
        ],
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting billed transactions
    if (transaction.status === 'billed') {
      return NextResponse.json(
        { error: 'Cannot delete a billed transaction' },
        { status: 400 }
      )
    }

    await prisma.creditCardTransaction.delete({
      where: { id: txId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit card transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

// PATCH /api/credit-cards/[id]/transactions/[txId] - Update a credit card transaction
export async function PATCH(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, txId } = await params
    const body = await request.json()

    // Verify card ownership
    const card = await prisma.creditCard.findFirst({
      where: { id, userId: user.id },
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }

    // Get user's household IDs for shared transactions
    const householdIds = await prisma.householdMember.findMany({
      where: { userId: user.id },
      select: { householdId: true },
    }).then(members => members.map(m => m.householdId))

    // Verify transaction exists
    // Allow editing if: user owns the transaction OR it's a shared transaction in user's household
    const transaction = await prisma.creditCardTransaction.findFirst({
      where: { 
        id: txId, 
        creditCardId: id,
        OR: [
          { userId: user.id },
          { isShared: true, householdId: { in: householdIds } },
        ],
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Don't allow editing billed transactions
    if (transaction.status === 'billed') {
      return NextResponse.json(
        { error: 'Cannot edit a billed transaction' },
        { status: 400 }
      )
    }

    const updated = await prisma.creditCardTransaction.update({
      where: { id: txId },
      data: {
        amount: body.amount !== undefined ? body.amount : undefined,
        description: body.description !== undefined ? body.description : undefined,
        date: body.date ? new Date(body.date) : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({ transaction: updated })
  } catch (error) {
    console.error('Error updating credit card transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
