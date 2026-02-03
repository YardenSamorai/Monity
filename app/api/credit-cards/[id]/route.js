import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyCreditCardChange } from '@/lib/pusher'

const updateCreditCardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastFourDigits: z.string().length(4).regex(/^\d{4}$/).optional(),
  billingDay: z.number().int().min(1).max(28).optional(),
  linkedAccountId: z.string().optional(),
  creditLimit: z.number().positive().nullable().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/credit-cards/[id] - Get a single credit card with transactions
export async function GET(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'billed', or null for all

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        linkedAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        transactions: {
          where: status ? { status } : {},
          orderBy: { date: 'desc' },
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
        },
      },
    })

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }

    // Calculate statistics
    const pendingSum = await prisma.creditCardTransaction.aggregate({
      where: {
        creditCardId: id,
        status: 'pending',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Calculate days until billing
    const today = new Date()
    const currentDay = today.getDate()
    let daysUntilBilling
    
    if (currentDay < creditCard.billingDay) {
      daysUntilBilling = creditCard.billingDay - currentDay
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, creditCard.billingDay)
      daysUntilBilling = Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24))
    }

    // Calculate limit usage percentage
    const limitUsedPercent = creditCard.creditLimit
      ? Math.round(((pendingSum._sum.amount || 0) / Number(creditCard.creditLimit)) * 100)
      : null

    return NextResponse.json({
      creditCard: {
        ...creditCard,
        pendingAmount: pendingSum._sum.amount || 0,
        pendingCount: pendingSum._count,
        daysUntilBilling,
        limitUsedPercent,
      },
    })
  } catch (error) {
    console.error('Error fetching credit card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit card' },
      { status: 500 }
    )
  }
}

// PATCH /api/credit-cards/[id] - Update a credit card
export async function PATCH(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateCreditCardSchema.parse(body)

    // Check ownership
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }

    // Verify linked account if changed
    if (validated.linkedAccountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: validated.linkedAccountId,
          userId: user.id,
        },
      })

      if (!account) {
        return NextResponse.json(
          { error: 'Invalid linked account' },
          { status: 400 }
        )
      }
    }

    const creditCard = await prisma.creditCard.update({
      where: { id },
      data: validated,
      include: {
        linkedAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    })

    // Revalidate cache and notify
    revalidateTag('credit-cards')
    revalidateTag('dashboard')
    notifyCreditCardChange(user.clerkUserId, 'updated', creditCard).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ creditCard })
  } catch (error) {
    console.error('Error updating credit card:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update credit card' },
      { status: 500 }
    )
  }
}

// DELETE /api/credit-cards/[id] - Delete a credit card
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership and get pending count
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: {
            transactions: {
              where: { status: 'pending' },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }

    // Warn if there are pending transactions
    if (existing._count.transactions > 0) {
      const { searchParams } = new URL(request.url)
      const force = searchParams.get('force') === 'true'
      
      if (!force) {
        return NextResponse.json(
          { 
            error: 'Card has pending transactions',
            pendingCount: existing._count.transactions,
            message: 'Add ?force=true to delete anyway'
          },
          { status: 400 }
        )
      }
    }

    await prisma.creditCard.delete({
      where: { id },
    })

    // Revalidate cache and notify
    revalidateTag('credit-cards')
    revalidateTag('dashboard')
    notifyCreditCardChange(user.clerkUserId, 'deleted', { id }).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit card:', error)
    return NextResponse.json(
      { error: 'Failed to delete credit card' },
      { status: 500 }
    )
  }
}
