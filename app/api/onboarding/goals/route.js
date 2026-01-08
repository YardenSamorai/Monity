import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goals } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update financial goals (stored as JSON string)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        financialGoals: JSON.stringify(goals || []),
      },
    })

    return NextResponse.json({ 
      success: true,
      goals: JSON.parse(updatedUser.financialGoals || '[]')
    })
  } catch (error) {
    console.error('Error saving goals:', error)
    return NextResponse.json(
      { error: 'Failed to save goals' },
      { status: 500 }
    )
  }
}

