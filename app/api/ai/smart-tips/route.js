import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/ai/smart-tips - Get AI-powered spending insights
export async function GET() {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const prevMonthEnd = new Date(currentYear, currentMonth, 0)
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1)

    // Fetch all needed data in parallel
    const [
      currentMonthTx,
      prevMonthTx,
      threeMonthsTx,
      budgets,
      recurringExpenses,
      recurringIncomes,
      goals,
      categories,
    ] = await Promise.all([
      // Current month transactions
      prisma.transaction.findMany({
        where: { userId: user.id, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
        include: { category: true },
      }),
      // Previous month transactions
      prisma.transaction.findMany({
        where: { userId: user.id, type: 'expense', date: { gte: prevMonthStart, lte: prevMonthEnd } },
        include: { category: true },
      }),
      // 3 months history (for averages)
      prisma.transaction.findMany({
        where: { userId: user.id, type: 'expense', date: { gte: threeMonthsAgo, lte: monthEnd } },
        include: { category: true },
      }),
      // Current budgets
      prisma.budget.findMany({
        where: { userId: user.id, year: currentYear, month: currentMonth + 1, isShared: false },
        include: { category: true },
      }),
      // Recurring expenses
      prisma.recurringTransaction.findMany({
        where: { userId: user.id, isActive: true },
        include: { category: true },
      }),
      // Recurring incomes
      prisma.recurringIncome.findMany({
        where: { userId: user.id, isActive: true },
      }),
      // Active savings goals
      prisma.savingsGoal.findMany({
        where: { userId: user.id, isCompleted: false, isPaused: false, isShared: false },
      }),
      // Categories
      prisma.category.findMany({
        where: { userId: user.id },
      }),
    ])

    const tips = []

    // ===== 1. BUDGET TRACKING =====
    // Compare actual spending to budgets
    budgets.forEach(budget => {
      const budgetAmount = Number(budget.amount)
      const catExpenses = currentMonthTx
        .filter(tx => budget.categoryId ? tx.categoryId === budget.categoryId : true)
        .reduce((sum, tx) => sum + Number(tx.amount), 0)
      
      const percentUsed = budgetAmount > 0 ? (catExpenses / budgetAmount) * 100 : 0
      const daysInMonth = monthEnd.getDate()
      const dayOfMonth = now.getDate()
      const expectedPercent = (dayOfMonth / daysInMonth) * 100
      const categoryName = budget.category?.name || 'הכולל'

      if (percentUsed > 100) {
        // Over budget
        tips.push({
          id: `budget-over-${budget.id}`,
          type: 'danger',
          icon: '🚨',
          titleKey: 'ai.overBudget',
          messageKey: 'ai.overBudgetMessage',
          messageData: {
            categoryName,
            percentUsed: Math.round(percentUsed),
            amount: Math.round(catExpenses),
            budget: Math.round(budgetAmount),
            overAmount: Math.round(catExpenses - budgetAmount),
          },
          priority: 'high',
          potentialSavings: 0,
        })
      } else if (percentUsed > 80 && percentUsed <= 100) {
        // Approaching budget
        const remaining = budgetAmount - catExpenses
        const daysLeft = daysInMonth - dayOfMonth
        tips.push({
          id: `budget-warn-${budget.id}`,
          type: 'warning',
          icon: '⚠️',
          titleKey: 'ai.budgetWarning',
          messageKey: 'ai.budgetWarningMessage',
          messageData: {
            categoryName,
            percentUsed: Math.round(percentUsed),
            remaining: Math.round(remaining),
            daysLeft,
            dailyLimit: daysLeft > 0 ? Math.round(remaining / daysLeft) : 0,
          },
          priority: 'high',
          potentialSavings: 0,
        })
      } else if (percentUsed > expectedPercent + 15) {
        // Spending faster than expected
        tips.push({
          id: `budget-pace-${budget.id}`,
          type: 'info',
          icon: '📈',
          titleKey: 'ai.spendingPace',
          messageKey: 'ai.spendingPaceMessage',
          messageData: {
            categoryName,
            percentUsed: Math.round(percentUsed),
            expectedPercent: Math.round(expectedPercent),
            amount: Math.round(catExpenses),
            budget: Math.round(budgetAmount),
          },
          priority: 'medium',
          potentialSavings: 0,
        })
      }
    })

    // ===== 2. MONTH-OVER-MONTH COMPARISON =====
    // Compare category spending to previous month
    const currentByCategory = {}
    const prevByCategory = {}
    
    currentMonthTx.forEach(tx => {
      const catId = tx.categoryId || 'uncategorized'
      const catName = tx.category?.name || 'ללא קטגוריה'
      if (!currentByCategory[catId]) currentByCategory[catId] = { total: 0, name: catName, count: 0 }
      currentByCategory[catId].total += Number(tx.amount)
      currentByCategory[catId].count++
    })
    
    prevMonthTx.forEach(tx => {
      const catId = tx.categoryId || 'uncategorized'
      const catName = tx.category?.name || 'ללא קטגוריה'
      if (!prevByCategory[catId]) prevByCategory[catId] = { total: 0, name: catName, count: 0 }
      prevByCategory[catId].total += Number(tx.amount)
      prevByCategory[catId].count++
    })

    // Find categories with significant increase
    Object.entries(currentByCategory).forEach(([catId, current]) => {
      const prev = prevByCategory[catId]
      if (!prev || prev.total < 50) return // Skip small categories or new ones
      
      const increase = ((current.total - prev.total) / prev.total) * 100
      
      if (increase > 50 && current.total > 200) {
        tips.push({
          id: `trend-up-${catId}`,
          type: 'warning',
          icon: '📊',
          titleKey: 'ai.spendingIncrease',
          messageKey: 'ai.spendingIncreaseMessage',
          messageData: {
            categoryName: current.name,
            currentAmount: Math.round(current.total),
            prevAmount: Math.round(prev.total),
            increase: Math.round(increase),
          },
          priority: increase > 100 ? 'high' : 'medium',
          potentialSavings: Math.round(current.total - prev.total),
        })
      }
    })

    // Find categories with significant decrease (positive reinforcement)
    Object.entries(prevByCategory).forEach(([catId, prev]) => {
      const current = currentByCategory[catId]
      if (!current || prev.total < 100) return
      
      const decrease = ((prev.total - current.total) / prev.total) * 100
      
      if (decrease > 30 && prev.total > 200) {
        tips.push({
          id: `trend-down-${catId}`,
          type: 'success',
          icon: '🎉',
          titleKey: 'ai.spendingDecrease',
          messageKey: 'ai.spendingDecreaseMessage',
          messageData: {
            categoryName: current.name,
            savedAmount: Math.round(prev.total - current.total),
            decrease: Math.round(decrease),
          },
          priority: 'low',
          potentialSavings: 0,
        })
      }
    })

    // ===== 3. RECURRING VS ACTUAL =====
    // Check if recurring expenses match actual spending
    recurringExpenses.forEach(rec => {
      const recAmount = Number(rec.amount)
      const catName = rec.category?.name || rec.description || 'הוצאה קבועה'
      
      // Find matching transaction this month
      const matchingTx = currentMonthTx.filter(tx => {
        if (rec.categoryId && tx.categoryId === rec.categoryId) return true
        if (rec.description && tx.description?.toLowerCase().includes(rec.description.toLowerCase())) return true
        return false
      })
      
      const actualSpent = matchingTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
      
      if (actualSpent > recAmount * 1.3 && recAmount > 100) {
        tips.push({
          id: `recurring-exceed-${rec.id}`,
          type: 'warning',
          icon: '🔄',
          titleKey: 'ai.recurringExceeded',
          messageKey: 'ai.recurringExceededMessage',
          messageData: {
            name: catName,
            expected: Math.round(recAmount),
            actual: Math.round(actualSpent),
            extra: Math.round(actualSpent - recAmount),
          },
          priority: 'medium',
          potentialSavings: Math.round(actualSpent - recAmount),
        })
      }
    })

    // ===== 4. TOP SPENDING CATEGORIES (NO BUDGET) =====
    // Suggest setting budgets for high-spend categories without budgets
    const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId).filter(Boolean))
    
    const topUnbudgeted = Object.entries(currentByCategory)
      .filter(([catId]) => catId !== 'uncategorized' && !budgetedCategoryIds.has(catId))
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 2)
    
    topUnbudgeted.forEach(([catId, data]) => {
      if (data.total > 300) {
        tips.push({
          id: `no-budget-${catId}`,
          type: 'info',
          icon: '💡',
          titleKey: 'ai.noBudgetSet',
          messageKey: 'ai.noBudgetSetMessage',
          messageData: {
            categoryName: data.name,
            amount: Math.round(data.total),
            suggestedBudget: Math.round(data.total * 0.9),
          },
          priority: 'low',
          potentialSavings: Math.round(data.total * 0.1),
        })
      }
    })

    // ===== 5. SAVINGS GOALS PROGRESS =====
    goals.forEach(goal => {
      const targetAmount = Number(goal.targetAmount)
      const currentAmount = Number(goal.currentAmount)
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
      
      if (goal.targetDate) {
        const daysLeft = Math.ceil((new Date(goal.targetDate) - now) / (1000 * 60 * 60 * 24))
        const remaining = targetAmount - currentAmount
        
        if (daysLeft > 0 && daysLeft < 60 && progress < 70) {
          const monthlyNeeded = remaining / (daysLeft / 30)
          tips.push({
            id: `goal-behind-${goal.id}`,
            type: 'warning',
            icon: '🎯',
            titleKey: 'ai.goalBehind',
            messageKey: 'ai.goalBehindMessage',
            messageData: {
              goalName: goal.name,
              progress: Math.round(progress),
              daysLeft,
              monthlyNeeded: Math.round(monthlyNeeded),
            },
            priority: 'medium',
            potentialSavings: 0,
          })
        }
      }
      
      // Almost there! Encouragement
      if (progress >= 80 && progress < 100) {
        tips.push({
          id: `goal-close-${goal.id}`,
          type: 'success',
          icon: '🏆',
          titleKey: 'ai.goalAlmostDone',
          messageKey: 'ai.goalAlmostDoneMessage',
          messageData: {
            goalName: goal.name,
            progress: Math.round(progress),
            remaining: Math.round(targetAmount - currentAmount),
          },
          priority: 'low',
          potentialSavings: 0,
        })
      }
    })

    // ===== 6. DAILY SPENDING PACE =====
    const totalCurrentMonth = currentMonthTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const dayOfMonth = now.getDate()
    const daysInMonth = monthEnd.getDate()
    const dailyAvg = totalCurrentMonth / Math.max(dayOfMonth, 1)
    const projectedMonth = dailyAvg * daysInMonth
    const totalPrevMonth = prevMonthTx.reduce((sum, tx) => sum + Number(tx.amount), 0)

    if (totalPrevMonth > 0 && projectedMonth > totalPrevMonth * 1.2 && dayOfMonth > 7) {
      tips.push({
        id: 'monthly-pace',
        type: 'warning',
        icon: '📅',
        titleKey: 'ai.monthlyPace',
        messageKey: 'ai.monthlyPaceMessage',
        messageData: {
          projected: Math.round(projectedMonth),
          prevMonth: Math.round(totalPrevMonth),
          dailyAvg: Math.round(dailyAvg),
          excess: Math.round(projectedMonth - totalPrevMonth),
        },
        priority: 'medium',
        potentialSavings: Math.round(projectedMonth - totalPrevMonth),
      })
    }

    // ===== 7. INCOME vs EXPENSE RATIO =====
    const monthlyIncome = await prisma.transaction.findMany({
      where: { userId: user.id, type: 'income', date: { gte: monthStart, lte: monthEnd } },
    })
    const totalIncome = monthlyIncome.reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    if (totalIncome > 0 && totalCurrentMonth > totalIncome * 0.9 && dayOfMonth > 10) {
      tips.push({
        id: 'income-expense-ratio',
        type: 'danger',
        icon: '⚖️',
        titleKey: 'ai.incomeExpenseAlert',
        messageKey: 'ai.incomeExpenseAlertMessage',
        messageData: {
          expenses: Math.round(totalCurrentMonth),
          income: Math.round(totalIncome),
          ratio: Math.round((totalCurrentMonth / totalIncome) * 100),
        },
        priority: 'high',
        potentialSavings: 0,
      })
    }

    // Sort by priority
    const priorityOrder = { high: 4, medium: 3, low: 2 }
    tips.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))

    return NextResponse.json({ 
      tips: tips.slice(0, 6),
      totalTips: tips.length,
    })
  } catch (error) {
    console.error('Error getting smart tips:', error)
    return NextResponse.json({ error: 'Failed to get tips', tips: [] }, { status: 500 })
  }
}
