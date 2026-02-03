import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyGoalChange } from '@/lib/pusher'

const createContributionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  note: z.string().optional(),
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

    // Check if goal exists and belongs to user
    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
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

    // Revalidate cache and notify
    revalidateTag('goals')
    revalidateTag('dashboard')
    notifyGoalChange(user.clerkUserId, 'contribution', { 
      ...updatedGoal, 
      amount: validated.amount 
    }).catch((err) => console.error('Pusher error:', err))

    return NextResponse.json({ contribution })
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

