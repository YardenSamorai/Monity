import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyGoalChange, notifyDashboardUpdate, notifyTransactionChange } from '@/lib/pusher'

const createContributionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  note: z.string().optional(),
  paymentMethod: z.enum(['account', 'cash', 'creditCard']).optional().default('account'),
  sourceId: z.string().optional(), // accountId or creditCardId
})

export async function POST(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = createContributionSchema.parse(body)

    // Check if goal exists and belongs to user or is shared family goal
    const userHouseholds = await prisma.householdMember.findMany({
      where: { userId: user.id },
      select: { householdId: true },
    })
    const householdIds = userHouseholds.map(m => m.householdId)

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          {
            isShared: true,
            householdId: { in: householdIds },
          },
        ],
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Create contribution
    const contribution = await prisma.goalContribution.create({
      data: {
        goalId: id,
        amount: validated.amount,
        date: new Date(validated.date),
        note: validated.note || null,
      },
    })

    // Update goal's current amount
    const updatedGoal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: {
          increment: validated.amount,
        },
      },
    })

    // Create transaction based on payment method
    let transaction = null
    const transactionDescription = `Contribution to ${goal.name}`
    
    if (validated.paymentMethod === 'creditCard' && validated.sourceId) {
      // Credit card transaction
      transaction = await prisma.creditCardTransaction.create({
        data: {
          creditCardId: validated.sourceId,
          userId: user.id,
          amount: validated.amount,
          description: transactionDescription,
          categoryId: null,
          date: new Date(validated.date),
          notes: validated.note || null,
          status: 'pending',
          savingsGoalId: id,
          // If goal is shared, make transaction shared too
          isShared: goal.isShared,
          householdId: goal.householdId,
        },
      })
    } else if (validated.paymentMethod === 'account' && validated.sourceId) {
      // Regular bank transaction
      transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'expense', // Savings contribution is an expense
          amount: validated.amount,
          description: transactionDescription,
          accountId: validated.sourceId,
          categoryId: null,
          date: new Date(validated.date),
          notes: validated.note || null,
          savingsGoalId: id,
          // If goal is shared, make transaction shared too
          isShared: goal.isShared,
          householdId: goal.householdId,
        },
      })
    }
    // For 'cash', we don't create a transaction (cash is not tracked)

    // Revalidate cache and notify
    revalidateTag('goals')
    revalidateTag('dashboard')
    revalidateTag('transactions')
    notifyGoalChange(user.clerkUserId, 'contribution', { 
      ...updatedGoal, 
      amount: validated.amount 
    }).catch((err) => console.error('Pusher error:', err))
    
    if (transaction) {
      notifyDashboardUpdate(user.clerkUserId, { action: 'transaction_created' }).catch((err) => console.error('Pusher error:', err))
      if (validated.paymentMethod === 'account') {
        notifyTransactionChange(user.clerkUserId, 'created', transaction, null).catch((err) => console.error('Pusher error:', err))
      }
    }

    return NextResponse.json({ contribution, transaction })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contribution:', error)
    return NextResponse.json(
      { error: 'Failed to add contribution' },
      { status: 500 }
    )
  }
}

