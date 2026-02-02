import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { detectAnomalies } from '@/lib/ai-insights'

// GET /api/insights/anomalies
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const anomalies = await detectAnomalies(prisma, user.id)

    return NextResponse.json({ anomalies })
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}

