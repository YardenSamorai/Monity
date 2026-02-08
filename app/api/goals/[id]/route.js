import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyGoalChange } from '@/lib/pusher'

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  contributionMode: z.enum(['flexible', 'fixed']).optional(),
  fixedMonthlyAmount: z.number().positive().nullable().optional(),
  isPaused: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
})

export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateGoalSchema.parse(body)

    // Check if goal exists and belongs to user or is shared family goal
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          {
            isShared: true,
            householdId: {
              in: (await prisma.householdMember.findMany({
                where: { userId: user.id },
                select: { householdId: true },
              })).map(m => m.householdId),
            },
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

    // Prepare update data
    const updateData = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.icon !== undefined) updateData.icon = validated.icon
    if (validated.targetAmount !== undefined) updateData.targetAmount = validated.targetAmount
    if (validated.currentAmount !== undefined) updateData.currentAmount = validated.currentAmount
    if (validated.targetDate !== undefined) {
      updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : null
    }
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.contributionMode !== undefined) updateData.contributionMode = validated.contributionMode
    if (validated.fixedMonthlyAmount !== undefined) updateData.fixedMonthlyAmount = validated.fixedMonthlyAmount
    if (validated.isPaused !== undefined) updateData.isPaused = validated.isPaused
    if (validated.isCompleted !== undefined) updateData.isCompleted = validated.isCompleted

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    })

    // Revalidate cache and notify
    revalidateTag('goals')
    revalidateTag('dashboard')
    notifyGoalChange(user.clerkUserId, 'updated', updated).catch((err) => console.error('Pusher error:', err))
    
    return NextResponse.json({ goal: updated })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
      // Revalidate cache even if goal not found to clear stale data
      revalidateTag('goals')
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Delete goal (contributions will be deleted via cascade)
    await prisma.savingsGoal.delete({
      where: { id },
    })

    // Revalidate cache and notify
    revalidateTag('goals')
    revalidateTag('dashboard')
    notifyGoalChange(user.clerkUserId, 'deleted', { id }).catch((err) => console.error('Pusher error:', err))
    
    return NextResponse.json({ success: true, message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}

