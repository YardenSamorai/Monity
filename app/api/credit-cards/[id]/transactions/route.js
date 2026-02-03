import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyDashboardUpdate, notifyCreditCardTransaction } from '@/lib/pusher'

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  isShared: z.boolean().optional(),
  householdId: z.string().optional(),
})

// GET /api/credit-cards/[id]/transactions - Get transactions for a card
export async function GET(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'billed', or null
    const limit = parseInt(searchParams.get('limit') || '50')

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

    const transactions = await prisma.creditCardTransaction.findMany({
      where: {
        creditCardId: id,
        ...(status && { status }),
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching card transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/credit-cards/[id]/transactions - Add a transaction to a card
export async function POST(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = createTransactionSchema.parse(body)

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

    // Verify category if provided
    if (validated.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validated.categoryId,
          OR: [
            { userId: user.id },
            { userId: null, isDefault: true },
          ],
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    const transaction = await prisma.creditCardTransaction.create({
      data: {
        creditCardId: id,
        userId: user.id,
        amount: validated.amount,
        description: validated.description,
        date: validated.date,
        categoryId: validated.categoryId,
        notes: validated.notes,
        isShared: validated.isShared || false,
        householdId: validated.householdId || card.householdId,
        status: 'pending',
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

    // Invalidate cache
    revalidateTag('dashboard')
    revalidateTag('credit-cards')
    
    // Trigger real-time updates (non-blocking)
    notifyDashboardUpdate(user.id, { action: 'credit_card_transaction' }).catch(() => {})
    notifyCreditCardTransaction(user.id, transaction, card.name).catch(() => {})

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Error creating card transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
