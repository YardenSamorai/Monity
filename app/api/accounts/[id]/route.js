import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAccountSchema } from '@/lib/validations'
import { notifyAccountChange } from '@/lib/pusher'

// PUT /api/accounts/[id] - Update account
export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = createAccountSchema.parse(body)

    const account = await prisma.account.findFirst({
      where: { id, userId: user.id },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type,
        currency: validated.currency,
        isActive: validated.isActive !== undefined ? validated.isActive : account.isActive,
      },
    })

    // Revalidate cache and notify
    revalidateTag('accounts')
    revalidateTag('dashboard')
    notifyAccountChange(user.clerkUserId, 'updated', updated).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ account: updated })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.account.findFirst({
      where: { id, userId: user.id },
      include: {
        transactions: {
          take: 1, // Just check if there are any
        },
        recurringIncomes: {
          take: 1, // Just check if there are any
        },
        recurringTransactions: {
          take: 1, // Just check if there are any
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Check if account is being used
    const isUsed = 
      account.transactions.length > 0 ||
      account.recurringIncomes.length > 0 ||
      account.recurringTransactions.length > 0

    if (isUsed) {
      return NextResponse.json(
        { 
          error: 'Account is in use',
          message: 'Cannot delete account that has transactions or recurring items',
        },
        { status: 400 }
      )
    }

    // Delete the account
    await prisma.account.delete({
      where: { id },
    })

    // Revalidate cache and notify
    revalidateTag('accounts')
    revalidateTag('dashboard')
    notifyAccountChange(user.clerkUserId, 'deleted', { id }).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

