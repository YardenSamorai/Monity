import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { forecastExpenses } from '@/lib/ai-insights'

// GET /api/insights/forecast?months=3
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '3')

    const forecast = await forecastExpenses(prisma, user.id, months)

    return NextResponse.json({ forecast })
  } catch (error) {
    console.error('Error forecasting expenses:', error)
    return NextResponse.json(
      { error: 'Failed to forecast expenses' },
      { status: 500 }
    )
  }
}

