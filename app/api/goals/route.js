import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyGoalChange } from '@/lib/pusher'

// GET - Fetch all goals for the current user
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const onlyShared = searchParams.get('onlyShared') === 'true'

    let where = { userId: user.id }
    
    if (onlyShared && householdId) {
      // Verify user is member of household
      const member = await prisma.householdMember.findFirst({
        where: { userId: user.id, householdId },
      })
      if (member) {
        where = {
          householdId,
          isShared: true,
        }
      }
    } else if (!onlyShared) {
      // Only personal goals (not shared)
      where.isShared = false
    }

    const goals = await prisma.savingsGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('🎯'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().nullable().optional(),
  initialSavedAmount: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  contributionMode: z.enum(['flexible', 'fixed', 'recurring']).default('flexible'),
  fixedMonthlyAmount: z.number().positive().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['monthly', 'yearly']).nullable().optional(),
  currency: z.string().default('USD'),
  householdId: z.string().nullable().optional(),
  isShared: z.boolean().default(false),
})

export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createGoalSchema.parse(body)

    // Verify household if shared
    let householdId = null
    if (validated.isShared && validated.householdId) {
      const member = await prisma.householdMember.findFirst({
        where: { userId: user.id, householdId: validated.householdId },
      })
      if (member) {
        householdId = validated.householdId
      }
    }

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
        isRecurring: validated.isRecurring || false,
        recurringPeriod: validated.recurringPeriod || null,
        currency: validated.currency || 'USD',
        isPaused: false,
        isCompleted: false,
        householdId: householdId,
        isShared: householdId ? true : false,
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

    // Revalidate cache and notify
    revalidateTag('goals')
    revalidateTag('dashboard')
    notifyGoalChange(user.clerkUserId, 'created', goal).catch((err) => console.error('Pusher error:', err))
    
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

