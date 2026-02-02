import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/transactions/[id]/tags - Add tag to transaction
export async function POST(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId: user.id },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Add tag to transaction
    const transactionTag = await prisma.transactionTag.create({
      data: {
        transactionId: id,
        tagId,
      },
    })

    return NextResponse.json({ transactionTag }, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag already added to transaction' },
        { status: 409 }
      )
    }
    console.error('Error adding tag to transaction:', error)
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id]/tags/[tagId] - Remove tag from transaction
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, tagId } = await params

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Find and delete the transaction tag
    const transactionTag = await prisma.transactionTag.findFirst({
      where: {
        transactionId: id,
        tag: {
          id: tagId,
          userId: user.id,
        },
      },
    })

    if (!transactionTag) {
      return NextResponse.json(
        { error: 'Tag not found on transaction' },
        { status: 404 }
      )
    }

    await prisma.transactionTag.delete({
      where: { id: transactionTag.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing tag from transaction:', error)
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    )
  }
}

