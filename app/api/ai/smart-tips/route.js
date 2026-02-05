import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSavingsRecommendations, detectAnomalies } from '@/lib/ai-insights'

// GET /api/ai/smart-tips - Get AI-powered spending tips
export async function GET() {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get savings recommendations
    const recommendations = await getSavingsRecommendations(prisma, user.id)
    
    // Get anomalies
    const anomalies = await detectAnomalies(prisma, user.id)

    // Transform into user-friendly tips with translation keys
    const tips = []

    // Add savings recommendations as tips
    recommendations.forEach(rec => {
      let tipType = 'info'
      let icon = '💡'
      
      if (rec.priority === 'high') {
        tipType = 'warning'
        icon = '⚠️'
      } else if (rec.type === 'over_budget') {
        tipType = 'danger'
        icon = '🚨'
      }

      tips.push({
        id: `rec-${rec.categoryId}-${rec.type}`,
        type: tipType,
        icon,
        // Use translation keys instead of hardcoded strings
        titleKey: getTipTitleKey(rec.type),
        messageKey: getTipMessageKey(rec.type),
        // Pass data for interpolation
        messageData: {
          amount: Math.round(rec.monthlyAvg || 0),
          categoryName: rec.categoryName,
          percentage: rec.overBudgetPercentage || 0,
        },
        category: rec.categoryName,
        potentialSavings: rec.potentialSavings,
        actionType: rec.type,
        priority: rec.priority,
      })
    })

    // Add anomaly alerts as tips
    anomalies.slice(0, 3).forEach(anomaly => {
      if (anomaly.type === 'unusual_transaction') {
        tips.push({
          id: `anomaly-${anomaly.transactionId}`,
          type: 'warning',
          icon: '🔍',
          titleKey: 'ai.unusualTransaction',
          messageKey: 'ai.unusualTransactionMessage',
          messageData: {
            description: anomaly.description,
            amount: Math.round(anomaly.amount),
          },
          category: anomaly.category,
          transactionId: anomaly.transactionId,
          priority: anomaly.severity,
        })
      } else if (anomaly.type === 'high_daily_spending') {
        tips.push({
          id: `anomaly-${anomaly.date}`,
          type: 'info',
          icon: '📊',
          titleKey: 'ai.highSpendingDay',
          messageKey: 'ai.highSpendingDayMessage',
          messageData: {
            date: anomaly.date,
            amount: Math.round(anomaly.amount),
            difference: Math.round(anomaly.difference),
          },
          priority: anomaly.severity,
        })
      }
    })

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    tips.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))

    return NextResponse.json({ 
      tips: tips.slice(0, 5),
      totalRecommendations: recommendations.length,
      totalAnomalies: anomalies.length,
    })
  } catch (error) {
    console.error('Error getting smart tips:', error)
    return NextResponse.json(
      { error: 'Failed to get tips', tips: [] },
      { status: 500 }
    )
  }
}

function getTipTitleKey(type) {
  const keys = {
    high_spending: 'ai.highSpendingAlert',
    many_small: 'ai.smallExpensesAddUp',
    unusual_spike: 'ai.unusualSpike',
    over_budget: 'ai.overBudget',
  }
  return keys[type] || 'ai.tip'
}

function getTipMessageKey(type) {
  const keys = {
    high_spending: 'ai.highSpendingMessage',
    many_small: 'ai.smallExpensesMessage',
    unusual_spike: 'ai.unusualSpikeMessage',
    over_budget: 'ai.overBudgetMessage',
  }
  return keys[type] || 'ai.tipMessage'
}
