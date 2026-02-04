/**
 * Smart AI-like features using pattern matching and statistics
 * No heavy ML required - uses user's transaction history
 */

/**
 * 1. Smart Category Detection
 * Learns from user's past transactions to suggest categories
 * Uses: description matching, price range learning, historical patterns
 */
export async function suggestCategory(prisma, userId, description, amount, type) {
  const numericAmount = Number(amount) || 0
  
  // Get user's full transaction history for learning (last 500 transactions)
  const history = await prisma.transaction.findMany({
    where: {
      userId,
      type,
      categoryId: { not: null },
    },
    include: { category: true },
    take: 500,
    orderBy: { date: 'desc' },
  })

  // Build category statistics from history
  const categoryStats = {}
  history.forEach(t => {
    if (!t.categoryId) return
    
    if (!categoryStats[t.categoryId]) {
      categoryStats[t.categoryId] = {
        count: 0,
        totalAmount: 0,
        amounts: [],
        descriptions: [],
      }
    }
    
    categoryStats[t.categoryId].count++
    categoryStats[t.categoryId].totalAmount += Number(t.amount)
    categoryStats[t.categoryId].amounts.push(Number(t.amount))
    categoryStats[t.categoryId].descriptions.push(t.description.toLowerCase())
  })
  
  // Calculate stats for each category
  Object.keys(categoryStats).forEach(catId => {
    const stat = categoryStats[catId]
    stat.avgAmount = stat.totalAmount / stat.count
    stat.minAmount = Math.min(...stat.amounts)
    stat.maxAmount = Math.max(...stat.amounts)
    // Standard deviation for amount range scoring
    const variance = stat.amounts.reduce((sum, amt) => sum + Math.pow(amt - stat.avgAmount, 2), 0) / stat.amounts.length
    stat.stdDev = Math.sqrt(variance)
  })

  // Also check for similar descriptions
  const descriptionLower = description.toLowerCase()
  const descriptionWords = extractKeywords(description)
  
  // Find transactions with similar descriptions
  const similarDescriptionMatches = history.filter(t => {
    const histDesc = t.description.toLowerCase()
    // Exact match
    if (histDesc === descriptionLower) return true
    // Contains same main words
    const histWords = extractKeywords(t.description)
    const matchingWords = descriptionWords.filter(w => histWords.includes(w))
    return matchingWords.length >= Math.min(2, descriptionWords.length)
  })
  
  // Count categories from similar descriptions
  const similarDescriptionCats = {}
  similarDescriptionMatches.forEach(t => {
    if (t.categoryId) {
      similarDescriptionCats[t.categoryId] = (similarDescriptionCats[t.categoryId] || 0) + 1
    }
  })

  // Get all user categories
  const categories = await prisma.category.findMany({
    where: { userId, type: { in: [type, 'both'] } },
  })

  // Score categories based on multiple factors
  const scored = categories.map(category => {
    let score = 0
    let reasons = []
    
    const stat = categoryStats[category.id]
    
    // 1. Similar description match (0-40 points) - HIGHEST WEIGHT
    if (similarDescriptionCats[category.id]) {
      const matchScore = Math.min(40, similarDescriptionCats[category.id] * 15)
      score += matchScore
      reasons.push('similar_description')
    }
    
    // 2. Historical usage frequency (0-25 points)
    if (stat) {
      const usageScore = Math.min(25, stat.count * 2)
      score += usageScore
      reasons.push('frequently_used')
    }
    
    // 3. Amount range match (0-25 points) - KEY FEATURE
    if (stat && numericAmount > 0) {
      // Check if amount falls within typical range for this category
      const lowerBound = stat.avgAmount - (stat.stdDev * 2)
      const upperBound = stat.avgAmount + (stat.stdDev * 2)
      
      if (numericAmount >= lowerBound && numericAmount <= upperBound) {
        // Perfect range match
        score += 25
        reasons.push('amount_range_match')
      } else if (numericAmount >= stat.minAmount && numericAmount <= stat.maxAmount) {
        // Within historical min/max
        score += 15
        reasons.push('amount_in_range')
      } else {
        // Partial match based on proximity
        const distanceFromAvg = Math.abs(numericAmount - stat.avgAmount)
        const proximity = Math.max(0, 1 - (distanceFromAvg / stat.avgAmount))
        score += Math.round(proximity * 10)
        if (proximity > 0.5) reasons.push('amount_close')
      }
    }
    
    // 4. Keyword matching (0-20 points)
    if (descriptionWords.some(kw => 
      category.name.toLowerCase().includes(kw) || 
      kw.includes(category.name.toLowerCase())
    )) {
      score += 20
      reasons.push('keyword_match')
    }
    
    // 5. Common merchant/keyword patterns (0-15 points)
    const commonPatterns = getCommonPatterns(category.name)
    if (commonPatterns.some(pattern => 
      descriptionLower.includes(pattern)
    )) {
      score += 15
      reasons.push('pattern_match')
    }
    
    return { 
      category, 
      score, 
      reasons,
      avgAmount: stat?.avgAmount || 0,
      usageCount: stat?.count || 0,
    }
  })

  // Sort by score and return top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(s => s.score > 0)
    .map(s => ({ 
      categoryId: s.category.id, 
      categoryName: s.category.name,
      categoryIcon: s.category.icon,
      categoryColor: s.category.color,
      confidence: Math.min(s.score / 100, 1),
      reasons: s.reasons,
      avgAmount: Math.round(s.avgAmount),
      usageCount: s.usageCount,
    }))
}

/**
 * 2. Savings Recommendations
 * Analyzes spending patterns and suggests where to save
 */
export async function getSavingsRecommendations(prisma, userId) {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Get expenses from last 3 months
  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) },
    },
    include: { category: true },
  })

  // Group by category and calculate averages
  const categoryStats = {}
  expenses.forEach(expense => {
    const catId = expense.categoryId || 'uncategorized'
    const catName = expense.category?.name || 'Uncategorized'
    
    if (!categoryStats[catId]) {
      categoryStats[catId] = {
        categoryId: catId,
        categoryName: catName,
        total: 0,
        count: 0,
        transactions: [],
      }
    }
    
    categoryStats[catId].total += Number(expense.amount)
    categoryStats[catId].count += 1
    categoryStats[catId].transactions.push(expense)
  })

  // Calculate monthly averages and identify opportunities
  const recommendations = []
  
  Object.values(categoryStats).forEach(stat => {
    const monthlyAvg = stat.total / 3
    const avgPerTransaction = stat.total / stat.count
    
    // Find unusual spikes (expenses 2x larger than average)
    const spikes = stat.transactions.filter(t => 
      Number(t.amount) > avgPerTransaction * 2
    )
    
    // Recommendations:
    // 1. Large monthly spending categories
    if (monthlyAvg > 500) {
      recommendations.push({
        type: 'high_spending',
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        message: `You spend ${Math.round(monthlyAvg)} per month on ${stat.categoryName}. Consider setting a budget.`,
        potentialSavings: Math.round(monthlyAvg * 0.2), // 20% savings potential
        priority: monthlyAvg > 1000 ? 'high' : 'medium',
      })
    }
    
    // 2. Too many small transactions (can add up)
    if (stat.count > 20 && avgPerTransaction < 50) {
      recommendations.push({
        type: 'many_small',
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        message: `You have ${stat.count} small transactions in ${stat.categoryName}. Consider consolidating.`,
        potentialSavings: Math.round(monthlyAvg * 0.15),
        priority: 'medium',
      })
    }
    
    // 3. Unusual spikes
    if (spikes.length > 0) {
      recommendations.push({
        type: 'unusual_spike',
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        message: `Found ${spikes.length} unusually large transactions in ${stat.categoryName}.`,
        potentialSavings: spikes.reduce((sum, t) => sum + (Number(t.amount) - avgPerTransaction), 0) / 3,
        priority: 'high',
      })
    }
  })

  // Compare to budgets if they exist
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    },
    include: { category: true },
  })

  budgets.forEach(budget => {
    const stat = categoryStats[budget.categoryId]
    if (stat) {
      const spent = stat.total
      const budgeted = Number(budget.amount)
      
      if (spent > budgeted * 1.2) { // 20% over budget
        recommendations.push({
          type: 'over_budget',
          categoryId: budget.categoryId,
          categoryName: budget.category?.name || 'Unknown',
          message: `You're ${Math.round(((spent / budgeted) - 1) * 100)}% over budget for ${budget.category?.name}.`,
          potentialSavings: Math.round(spent - budgeted),
          priority: 'high',
        })
      }
    }
  })

  // Sort by priority and potential savings
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.potentialSavings - a.potentialSavings
    })
    .slice(0, 5) // Top 5 recommendations
}

/**
 * 3. Anomaly Detection (Suspicious Activity)
 * Detects unusual spending patterns
 */
export async function detectAnomalies(prisma, userId) {
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: last30Days },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })

  // Get historical averages
  const historical = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: last90Days, lt: last30Days }, // 30-90 days ago
    },
    include: { category: true },
  })

  // Calculate daily average spending
  const dailyAvg = historical.reduce((sum, t) => sum + Number(t.amount), 0) / 60
  
  // Group recent expenses by day
  const dailySpending = {}
  recentTransactions.forEach(t => {
    if (t.type === 'expense') {
      const day = t.date.toISOString().split('T')[0]
      dailySpending[day] = (dailySpending[day] || 0) + Number(t.amount)
    }
  })

  const anomalies = []
  
  // 1. Unusually high daily spending (3x average)
  Object.entries(dailySpending).forEach(([day, amount]) => {
    if (amount > dailyAvg * 3) {
      const dayTransactions = recentTransactions.filter(t => 
        t.date.toISOString().split('T')[0] === day && t.type === 'expense'
      )
      
      anomalies.push({
        type: 'high_daily_spending',
        date: day,
        amount,
        average: dailyAvg,
        difference: amount - dailyAvg,
        transactions: dayTransactions.slice(0, 5), // Top 5
        severity: amount > dailyAvg * 5 ? 'high' : 'medium',
      })
    }
  })

  // 2. Unusual large single transaction (5x category average)
  const categoryAverages = {}
  historical.forEach(t => {
    if (t.categoryId) {
      if (!categoryAverages[t.categoryId]) {
        categoryAverages[t.categoryId] = { total: 0, count: 0 }
      }
      categoryAverages[t.categoryId].total += Number(t.amount)
      categoryAverages[t.categoryId].count += 1
    }
  })

  recentTransactions.forEach(t => {
    if (t.type === 'expense' && t.categoryId) {
      const avg = categoryAverages[t.categoryId]
      if (avg && avg.count > 5) {
        const categoryAvg = avg.total / avg.count
        if (Number(t.amount) > categoryAvg * 5) {
          anomalies.push({
            type: 'unusual_transaction',
            transactionId: t.id,
            date: t.date,
            amount: Number(t.amount),
            category: t.category?.name || 'Unknown',
            average: categoryAvg,
            description: t.description,
            severity: Number(t.amount) > categoryAvg * 10 ? 'high' : 'medium',
          })
        }
      }
    }
  })

  // 3. Spending at unusual times (e.g., 2am, weekend if normally weekday)
  recentTransactions.forEach(t => {
    const hour = new Date(t.date).getHours()
    if (hour >= 2 && hour <= 5 && Number(t.amount) > 100) {
      anomalies.push({
        type: 'unusual_time',
        transactionId: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        hour,
        severity: 'low',
      })
    }
  })

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  }).slice(0, 10) // Top 10 anomalies
}

/**
 * 4. Expense Forecasting
 * Predicts future expenses based on history and recurring patterns
 */
export async function forecastExpenses(prisma, userId, monthsAhead = 3) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Get recurring transactions
  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true },
    include: { category: true, account: true },
  })

  // Get historical spending patterns (last 6 months)
  const history = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) },
    },
    include: { category: true },
  })

  // Calculate monthly averages by category
  const monthlyCategoryAvg = {}
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthExpenses = history.filter(t => 
      t.date >= monthStart && t.date <= monthEnd
    )
    
    monthExpenses.forEach(t => {
      const catId = t.categoryId || 'uncategorized'
      if (!monthlyCategoryAvg[catId]) {
        monthlyCategoryAvg[catId] = []
      }
      monthlyCategoryAvg[catId].push(Number(t.amount))
    })
  }

  // Forecast for next N months
  const forecast = []
  
  for (let monthOffset = 0; monthOffset < monthsAhead; monthOffset++) {
    const forecastMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1)
    let monthTotal = 0
    const categoryForecasts = {}

    // Add recurring transactions
    recurring.forEach(recur => {
      const dayOfMonth = recur.dayOfMonth
      const forecastDate = new Date(forecastMonth.getFullYear(), forecastMonth.getMonth(), dayOfMonth)
      
      // Check if transaction should occur (not past end date)
      if (!recur.endDate || forecastDate <= new Date(recur.endDate)) {
        const amount = Number(recur.amount)
        monthTotal += amount
        
        const catId = recur.categoryId || 'uncategorized'
        categoryForecasts[catId] = (categoryForecasts[catId] || 0) + amount
      }
    })

    // Add average historical spending for non-recurring categories
    Object.entries(monthlyCategoryAvg).forEach(([catId, amounts]) => {
      if (amounts.length > 0) {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
        monthTotal += avg
        categoryForecasts[catId] = (categoryForecasts[catId] || 0) + avg
      }
    })

    forecast.push({
      month: forecastMonth.getMonth() + 1,
      year: forecastMonth.getFullYear(),
      monthName: forecastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total: Math.round(monthTotal),
      byCategory: Object.entries(categoryForecasts).map(([catId, amount]) => ({
        categoryId: catId,
        amount: Math.round(amount),
      })),
    })
  }

  // Calculate trend (increasing/decreasing/stable)
  if (forecast.length >= 2) {
    const trend = forecast[1].total - forecast[0].total
    forecast.forEach(f => {
      f.trend = trend > 100 ? 'increasing' : trend < -100 ? 'decreasing' : 'stable'
      f.trendAmount = Math.round(trend)
    })
  }

  return forecast
}

// Helper functions

function extractKeywords(text) {
  // Extract meaningful words (remove common words)
  const stopWords = ['the', 'at', 'for', 'of', 'and', 'a', 'an', 'in', 'on', 'to', 'from']
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
}

function getCommonPatterns(categoryName) {
  // Common merchant/keyword patterns for categories
  const patterns = {
    'Food & Dining': ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'pizza', 'food', 'dining'],
    'Transportation': ['uber', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train'],
    'Shopping': ['amazon', 'store', 'shop', 'mall', 'purchase', 'buy'],
    'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill'],
    'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'theater'],
    'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medicine', 'clinic'],
  }
  
  return patterns[categoryName] || []
}

