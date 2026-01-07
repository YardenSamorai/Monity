import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('🎯'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().nullable().optional(),
  initialSavedAmount: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  contributionMode: z.enum(['flexible', 'fixed']).default('flexible'),
  fixedMonthlyAmount: z.number().positive().nullable().optional(),
})

export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createGoalSchema.parse(body)

    // Create goal
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: validated.name,
        icon: validated.icon,
        targetAmount: validated.targetAmount,
        currentAmount: validated.initialSavedAmount,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        priority: validated.priority,
        contributionMode: validated.contributionMode,
        fixedMonthlyAmount: validated.fixedMonthlyAmount,
        isPaused: false,
        isCompleted: false,
      },
    })

    // If initial saved amount > 0, create initial contribution
    if (validated.initialSavedAmount > 0) {
      await prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          amount: validated.initialSavedAmount,
          date: new Date(),
          note: 'Initial deposit',
        },
      })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

