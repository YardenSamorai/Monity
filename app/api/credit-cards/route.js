import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCreditCardSchema = z.object({
  name: z.string().min(1).max(100),
  lastFourDigits: z.string().length(4).regex(/^\d{4}$/),
  billingDay: z.number().int().min(1).max(28),
  linkedAccountId: z.string(),
  creditLimit: z.number().positive().optional(),
  color: z.string().optional(),
  householdId: z.string().optional(),
})

// GET /api/credit-cards - Get all credit cards
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTransactions = searchParams.get('includeTransactions') === 'true'
    const onlyActive = searchParams.get('onlyActive') !== 'false'

    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: user.id,
        ...(onlyActive && { isActive: true }),
      },
      include: {
        linkedAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        ...(includeTransactions && {
          transactions: {
            where: { status: 'pending' },
            orderBy: { date: 'desc' },
            take: 10,
          },
        }),
        _count: {
          select: {
            transactions: {
              where: { status: 'pending' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate pending amounts
    const cardsWithPending = await Promise.all(
      creditCards.map(async (card) => {
        const pendingSum = await prisma.creditCardTransaction.aggregate({
          where: {
            creditCardId: card.id,
            status: 'pending',
          },
          _sum: { amount: true },
        })

        // Calculate days until billing
        const today = new Date()
        const currentDay = today.getDate()
        let daysUntilBilling
        
        if (currentDay < card.billingDay) {
          daysUntilBilling = card.billingDay - currentDay
        } else {
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, card.billingDay)
          daysUntilBilling = Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24))
        }

        return {
          ...card,
          pendingAmount: pendingSum._sum.amount || 0,
          pendingCount: card._count.transactions,
          daysUntilBilling,
        }
      })
    )

    return NextResponse.json({ creditCards: cardsWithPending })
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit cards' },
      { status: 500 }
    )
  }
}

// POST /api/credit-cards - Create a new credit card
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createCreditCardSchema.parse(body)

    // Verify the linked account belongs to the user
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

    const creditCard = await prisma.creditCard.create({
      data: {
        userId: user.id,
        name: validated.name,
        lastFourDigits: validated.lastFourDigits,
        billingDay: validated.billingDay,
        linkedAccountId: validated.linkedAccountId,
        creditLimit: validated.creditLimit,
        color: validated.color || '#3B82F6',
        householdId: validated.householdId,
      },
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

    return NextResponse.json({ creditCard }, { status: 201 })
  } catch (error) {
    console.error('Error creating credit card:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create credit card' },
      { status: 500 }
    )
  }
}
