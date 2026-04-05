import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const user = await getOrCreateUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goals } = body

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

