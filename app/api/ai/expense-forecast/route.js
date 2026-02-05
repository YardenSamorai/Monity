import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { forecastExpenses } from '@/lib/ai-insights'

// GET /api/ai/expense-forecast - Get expense forecast for next months
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '3')

    const forecastResult = await forecastExpenses(prisma, user.id, months)

    // If not enough data, return with flag
    if (!forecastResult.hasEnoughData) {
      // Get current month data anyway
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const currentMonthExpenses = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      })

      const currentMonth = {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthName: now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
        monthNameEn: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total: Math.round(Number(currentMonthExpenses._sum.amount) || 0),
        isCurrent: true,
      }

      return NextResponse.json({ 
        hasEnoughData: false,
        minTransactionsNeeded: forecastResult.minTransactionsNeeded,
        currentTransactions: forecastResult.currentTransactions,
        minMonthsNeeded: forecastResult.minMonthsNeeded,
        currentMonths: forecastResult.currentMonths,
        forecast: [currentMonth],
        currentMonthSpent: currentMonth.total,
      })
    }

    // Get current month spending for comparison
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const currentMonthExpenses = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })

    const currentMonth = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      monthName: now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
      monthNameEn: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total: Math.round(Number(currentMonthExpenses._sum.amount) || 0),
      isCurrent: true,
    }

    return NextResponse.json({ 
      hasEnoughData: true,
      forecast: [currentMonth, ...forecastResult.forecast],
      currentMonthSpent: currentMonth.total,
      historicalAverage: forecastResult.historicalAverage,
      trendPercentage: forecastResult.trendPercentage,
      dataMonths: forecastResult.dataMonths,
    })
  } catch (error) {
    console.error('Error getting expense forecast:', error)
    return NextResponse.json(
      { error: 'Failed to get forecast', forecast: [], hasEnoughData: false },
      { status: 500 }
    )
  }
}
