import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSavingsRecommendations } from '@/lib/ai-insights'

// GET /api/insights/savings
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recommendations = await getSavingsRecommendations(prisma, user.id)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error getting savings recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to get savings recommendations' },
      { status: 500 }
    )
  }
}

