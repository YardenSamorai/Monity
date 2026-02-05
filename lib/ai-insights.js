/**
 * Smart AI-like features using pattern matching and statistics
 * Optimized for Hebrew and English, learns from user's transaction history
 */

/**
 * Calculate text similarity using Levenshtein distance (works for Hebrew!)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.9
  
  // Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null))
  
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      )
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length)
  return maxLen > 0 ? 1 - (track[s2.length][s1.length] / maxLen) : 0
}

/**
 * Check if amount is close (within 10% tolerance)
 */
function isAmountClose(amount1, amount2, tolerance = 0.1) {
  if (amount1 === 0 || amount2 === 0) return false
  const diff = Math.abs(amount1 - amount2)
  const avg = (amount1 + amount2) / 2
  return diff / avg <= tolerance
}

/**
 * 1. Smart Category Detection - IMPROVED
 * Learns from user's past transactions with focus on:
 * - EXACT matches (same description + same amount = HIGHEST priority)
 * - Similar descriptions (Hebrew-aware fuzzy matching)
 * - Same amount patterns
 * - Recent transactions have more weight
 * - Daily recurring patterns detection
 */
export async function suggestCategory(prisma, userId, description, amount, type) {
  const numericAmount = Number(amount) || 0
  const descriptionLower = (description || '').toLowerCase().trim()
  
  if (!descriptionLower && numericAmount === 0) {
    return []
  }
  
  // Get user's transaction history (last 1000 for better learning)
  const history = await prisma.transaction.findMany({
    where: {
      userId,
      type,
      categoryId: { not: null },
    },
    include: { category: true },
    take: 1000,
    orderBy: { date: 'desc' },
  })

  if (history.length === 0) {
    return []
  }

  // Get all user categories for this type
  const categories = await prisma.category.findMany({
    where: { userId, type: { in: [type, 'both'] } },
  })

  const now = new Date()
  const categoryScores = {}

  // Initialize scores for all categories
  categories.forEach(cat => {
    categoryScores[cat.id] = {
      category: cat,
      score: 0,
      reasons: [],
      matchedTransaction: null,
      avgAmount: 0,
      usageCount: 0,
      lastUsed: null,
    }
  })

  // Analyze each historical transaction
  history.forEach((transaction, index) => {
    const catId = transaction.categoryId
    if (!categoryScores[catId]) return

    const transDesc = (transaction.description || '').toLowerCase().trim()
    const transAmount = Number(transaction.amount)
    const daysAgo = Math.max(1, Math.ceil((now - new Date(transaction.date)) / (1000 * 60 * 60 * 24)))
    
    // Recency factor: more recent = higher weight (exponential decay)
    const recencyMultiplier = Math.exp(-daysAgo / 60) // Half-life of ~60 days
    
    // Track usage stats
    categoryScores[catId].usageCount++
    categoryScores[catId].avgAmount = 
      (categoryScores[catId].avgAmount * (categoryScores[catId].usageCount - 1) + transAmount) / 
      categoryScores[catId].usageCount
    
    if (!categoryScores[catId].lastUsed) {
      categoryScores[catId].lastUsed = transaction.date
    }

    // ==========================================
    // SCORING SYSTEM - Higher points = Better match
    // ==========================================
    
    // 1. EXACT MATCH: Same description AND same amount (±10%)
    //    This is the STRONGEST signal - 100 points!
    if (descriptionLower && transDesc) {
      const textSimilarity = calculateSimilarity(descriptionLower, transDesc)
      
      if (textSimilarity >= 0.85 && isAmountClose(numericAmount, transAmount, 0.1)) {
        const bonus = 100 * recencyMultiplier * textSimilarity
        categoryScores[catId].score += bonus
        if (!categoryScores[catId].reasons.includes('exact_match')) {
          categoryScores[catId].reasons.push('exact_match')
          categoryScores[catId].matchedTransaction = transaction
        }
      }
      // 2. HIGH SIMILARITY description (>=75%) - 60 points
      else if (textSimilarity >= 0.75) {
        const bonus = 60 * recencyMultiplier * textSimilarity
        categoryScores[catId].score += bonus
        if (!categoryScores[catId].reasons.includes('similar_description')) {
          categoryScores[catId].reasons.push('similar_description')
          categoryScores[catId].matchedTransaction = categoryScores[catId].matchedTransaction || transaction
        }
      }
      // 3. PARTIAL MATCH description (>=50%) - 30 points
      else if (textSimilarity >= 0.5) {
        const bonus = 30 * recencyMultiplier * textSimilarity
        categoryScores[catId].score += bonus
        if (!categoryScores[catId].reasons.includes('partial_match')) {
          categoryScores[catId].reasons.push('partial_match')
        }
      }
    }

    // 4. EXACT AMOUNT match (no description needed) - 25 points
    //    If user entered amount only, find categories with same amount
    if (numericAmount > 0 && transAmount === numericAmount) {
      const bonus = 25 * recencyMultiplier
      categoryScores[catId].score += bonus
      if (!categoryScores[catId].reasons.includes('exact_amount')) {
        categoryScores[catId].reasons.push('exact_amount')
      }
    }
    // 5. CLOSE AMOUNT (±20%) - 10 points
    else if (numericAmount > 0 && isAmountClose(numericAmount, transAmount, 0.2)) {
      const bonus = 10 * recencyMultiplier
      categoryScores[catId].score += bonus
      if (!categoryScores[catId].reasons.includes('similar_amount')) {
        categoryScores[catId].reasons.push('similar_amount')
      }
    }
  })

  // 6. CATEGORY NAME MATCH - Check if description matches category name
  if (descriptionLower) {
    categories.forEach(cat => {
      const catNameLower = cat.name.toLowerCase()
      const similarity = calculateSimilarity(descriptionLower, catNameLower)
      
      if (similarity >= 0.6) {
        categoryScores[cat.id].score += 40 * similarity
        if (!categoryScores[cat.id].reasons.includes('category_name_match')) {
          categoryScores[cat.id].reasons.push('category_name_match')
        }
      }
    })
  }

  // 7. DAILY RECURRING PATTERN DETECTION
  // Check if this category has transactions on many different days (recurring habit)
  Object.keys(categoryScores).forEach(catId => {
    const catTransactions = history.filter(t => t.categoryId === catId)
    const uniqueDays = new Set(catTransactions.map(t => 
      new Date(t.date).toISOString().split('T')[0]
    ))
    
    // If used on 10+ different days, it's a recurring pattern
    if (uniqueDays.size >= 10 && catTransactions.length >= 15) {
      categoryScores[catId].score += 15
      if (!categoryScores[catId].reasons.includes('recurring_pattern')) {
        categoryScores[catId].reasons.push('recurring_pattern')
      }
    }
  })

  // PENALTY: Reduce score for very generic categories with no specific match
  // If a category has high usage but no text/amount match, reduce its dominance
  Object.keys(categoryScores).forEach(catId => {
    const cs = categoryScores[catId]
    const hasSpecificMatch = cs.reasons.some(r => 
      ['exact_match', 'similar_description', 'exact_amount', 'category_name_match'].includes(r)
    )
    
    if (!hasSpecificMatch && cs.usageCount > 20) {
      // Penalty for high-frequency categories without specific match
      cs.score = Math.max(0, cs.score - (cs.usageCount * 0.5))
    }
  })

  // Sort by score and return top 3 with meaningful scores
  const results = Object.values(categoryScores)
    .filter(cs => cs.score > 5) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(cs => ({
      categoryId: cs.category.id,
      categoryName: cs.category.name,
      categoryIcon: cs.category.icon,
      categoryColor: cs.category.color,
      confidence: Math.min(cs.score / 100, 1),
      reasons: cs.reasons,
      avgAmount: Math.round(cs.avgAmount),
      usageCount: cs.usageCount,
      matchedDescription: cs.matchedTransaction?.description,
      matchedAmount: cs.matchedTransaction ? Number(cs.matchedTransaction.amount) : null,
    }))

  return results
}

/**
 * 2. Savings Recommendations
 * Analyzes spending patterns and suggests where to save
 */
export async function getSavingsRecommendations(prisma, userId) {
  const now = new Date()
  
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
        monthlyAvg: Math.round(monthlyAvg),
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
        transactionCount: stat.count,
        monthlyAvg: Math.round(monthlyAvg),
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
        spikeCount: spikes.length,
        potentialSavings: Math.round(spikes.reduce((sum, t) => sum + (Number(t.amount) - avgPerTransaction), 0) / 3),
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
        const overBudgetPercentage = Math.round(((spent / budgeted) - 1) * 100)
        recommendations.push({
          type: 'over_budget',
          categoryId: budget.categoryId,
          categoryName: budget.category?.name || 'Unknown',
          overBudgetPercentage,
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
  
  // Get recurring transactions
  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true },
    include: { category: true, account: true },
  })

  // Get historical spending patterns (last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const history = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: sixMonthsAgo },
    },
    include: { category: true },
  })

  // Check if we have enough data for a meaningful forecast
  const MIN_TRANSACTIONS_FOR_FORECAST = 10
  const MIN_MONTHS_OF_DATA = 2
  
  // Count unique months with transactions
  const uniqueMonths = new Set()
  history.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`
    uniqueMonths.add(monthKey)
  })

  // Not enough data - return empty with flag
  if (history.length < MIN_TRANSACTIONS_FOR_FORECAST || uniqueMonths.size < MIN_MONTHS_OF_DATA) {
    return {
      hasEnoughData: false,
      minTransactionsNeeded: MIN_TRANSACTIONS_FOR_FORECAST,
      currentTransactions: history.length,
      minMonthsNeeded: MIN_MONTHS_OF_DATA,
      currentMonths: uniqueMonths.size,
      forecast: [],
    }
  }

  // Calculate monthly totals for historical months
  const monthlyTotals = {}
  for (let i = 1; i <= 6; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`
    
    const monthExpenses = history.filter(t => 
      t.date >= monthStart && t.date <= monthEnd
    )
    
    if (monthExpenses.length > 0) {
      monthlyTotals[monthKey] = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0)
    }
  }

  // Calculate weighted average (more recent months have higher weight)
  const monthKeys = Object.keys(monthlyTotals).sort().reverse() // Most recent first
  let weightedSum = 0
  let weightTotal = 0
  monthKeys.forEach((key, index) => {
    const weight = monthKeys.length - index // More recent = higher weight
    weightedSum += monthlyTotals[key] * weight
    weightTotal += weight
  })
  
  const weightedAverage = weightTotal > 0 ? weightedSum / weightTotal : 0

  // Calculate trend (comparing last 3 months average vs previous 3 months)
  const recentMonths = monthKeys.slice(0, 3)
  const olderMonths = monthKeys.slice(3, 6)
  
  const recentAvg = recentMonths.length > 0 
    ? recentMonths.reduce((sum, k) => sum + monthlyTotals[k], 0) / recentMonths.length 
    : 0
  const olderAvg = olderMonths.length > 0 
    ? olderMonths.reduce((sum, k) => sum + monthlyTotals[k], 0) / olderMonths.length 
    : recentAvg

  // Calculate percentage change for trend
  const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

  // Calculate recurring total
  const recurringTotal = recurring
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  // Forecast for next N months
  const forecast = []
  
  for (let monthOffset = 1; monthOffset <= monthsAhead; monthOffset++) {
    const forecastMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    
    // Base forecast on weighted average
    let baseAmount = weightedAverage
    
    // Apply trend adjustment (but limit it to avoid runaway predictions)
    const trendAdjustment = Math.max(-0.1, Math.min(0.1, trendPercentage / 100)) // Cap at ±10%
    const trendMultiplier = 1 + (trendAdjustment * monthOffset)
    
    // Add some variance based on historical standard deviation
    const monthlyValues = Object.values(monthlyTotals)
    const mean = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
    const variance = monthlyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyValues.length
    const stdDev = Math.sqrt(variance)
    
    // Add small random variance (±5% of std dev) for more realistic forecast
    const varianceFactor = 1 + ((Math.random() - 0.5) * 0.1 * (stdDev / mean || 0))
    
    const forecastTotal = Math.round(baseAmount * trendMultiplier * varianceFactor)

    // Determine trend direction
    let trend = 'stable'
    if (trendPercentage > 5) trend = 'increasing'
    else if (trendPercentage < -5) trend = 'decreasing'

    forecast.push({
      month: forecastMonth.getMonth() + 1,
      year: forecastMonth.getFullYear(),
      monthName: forecastMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
      monthNameEn: forecastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total: forecastTotal,
      recurringTotal: recurringTotal,
      trend,
      trendAmount: Math.round(forecastTotal - weightedAverage),
      confidence: Math.max(0.3, 1 - (monthOffset * 0.15)), // Confidence decreases with distance
    })
  }

  return {
    hasEnoughData: true,
    historicalAverage: Math.round(weightedAverage),
    trendPercentage: Math.round(trendPercentage),
    dataMonths: uniqueMonths.size,
    forecast,
  }
}
