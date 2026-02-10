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
 * Check if amount is close (within tolerance)
 */
function isAmountClose(amount1, amount2, tolerance = 0.1) {
  if (amount1 === 0 || amount2 === 0) return false
  const diff = Math.abs(amount1 - amount2)
  const avg = (amount1 + amount2) / 2
  return diff / avg <= tolerance
}

/**
 * Check if amounts are effectively equal (handles floating point)
 */
function isAmountEqual(amount1, amount2) {
  return Math.abs(amount1 - amount2) < 0.01
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

  console.log(`[suggestCategory] History count: ${history.length}, looking for amount: ${numericAmount}`)
  
  // Debug: log amounts that match or are close
  if (numericAmount > 0) {
    const matchingAmounts = history.filter(t => {
      const tAmount = Number(t.amount)
      return Math.abs(tAmount - numericAmount) < 0.01 || 
             (Math.abs(tAmount - numericAmount) / Math.max(tAmount, numericAmount) <= 0.15)
    })
    console.log(`[suggestCategory] Found ${matchingAmounts.length} transactions with similar amounts:`, 
      matchingAmounts.slice(0, 5).map(t => ({ 
        desc: t.description, 
        amount: Number(t.amount), 
        category: t.category?.name 
      }))
    )
  }

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

    // 4. EXACT AMOUNT match (no description needed)
    //    If user entered amount only, find categories with same amount
    //    MORE AGGRESSIVE when no description is provided!
    if (numericAmount > 0 && isAmountEqual(numericAmount, transAmount)) {
      // Give MORE points when there's no description (amount-only search)
      const basePoints = descriptionLower ? 25 : 50
      const bonus = basePoints * recencyMultiplier
      categoryScores[catId].score += bonus
      if (!categoryScores[catId].reasons.includes('exact_amount')) {
        categoryScores[catId].reasons.push('exact_amount')
        // Store the matched transaction for amount-only matches
        if (!descriptionLower && !categoryScores[catId].matchedTransaction) {
          categoryScores[catId].matchedTransaction = transaction
        }
      }
    }
    // 5. CLOSE AMOUNT (±15%) - more points when no description
    else if (numericAmount > 0 && isAmountClose(numericAmount, transAmount, 0.15)) {
      const basePoints = descriptionLower ? 10 : 25
      const bonus = basePoints * recencyMultiplier
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
  // BUT only apply penalty if user provided a description (not amount-only)
  if (descriptionLower) {
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
  }

  // Debug: log top scores
  const sortedScores = Object.values(categoryScores)
    .filter(cs => cs.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  
  console.log('[suggestCategory] Top scores:', sortedScores.map(cs => ({
    category: cs.category.name,
    score: cs.score.toFixed(2),
    reasons: cs.reasons,
    usageCount: cs.usageCount,
  })))

  // Sort by score and return top 3 with meaningful scores
  // Lower threshold (>2) to be more inclusive
  const results = Object.values(categoryScores)
    .filter(cs => cs.score > 2) // Lower minimum threshold
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
 * - Correctly counts actual months with data
 * - Compares current month to previous months
 * - Checks budgets and recurring expenses
 */
export async function getSavingsRecommendations(prisma, userId) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthStart = new Date(currentYear, currentMonth, 1)
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0)
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1)
  const prevMonthEnd = new Date(currentYear, currentMonth, 0)
  const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1)
  
  // Fetch current month, previous month, and 3 months of history
  const [currentMonthExpenses, prevMonthExpenses, allExpenses, budgets, recurringExpenses] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: currentMonthStart, lte: currentMonthEnd } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: prevMonthStart, lte: prevMonthEnd } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: threeMonthsAgo, lte: currentMonthEnd } },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId, year: currentYear, month: currentMonth + 1, isShared: false },
      include: { category: true },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      include: { category: true },
    }),
  ])

  // Count actual months with data
  const monthsWithData = new Set()
  allExpenses.forEach(e => {
    monthsWithData.add(`${e.date.getFullYear()}-${e.date.getMonth()}`)
  })
  const actualMonths = Math.max(1, monthsWithData.size)

  // Group CURRENT month expenses by category
  const currentByCategory = {}
  currentMonthExpenses.forEach(e => {
    const catId = e.categoryId || 'uncategorized'
    const catName = e.category?.name || 'ללא קטגוריה'
    if (!currentByCategory[catId]) {
      currentByCategory[catId] = { total: 0, count: 0, name: catName, color: e.category?.color }
    }
    currentByCategory[catId].total += Number(e.amount)
    currentByCategory[catId].count++
  })

  // Group PREVIOUS month expenses by category
  const prevByCategory = {}
  prevMonthExpenses.forEach(e => {
    const catId = e.categoryId || 'uncategorized'
    const catName = e.category?.name || 'ללא קטגוריה'
    if (!prevByCategory[catId]) {
      prevByCategory[catId] = { total: 0, count: 0, name: catName }
    }
    prevByCategory[catId].total += Number(e.amount)
    prevByCategory[catId].count++
  })

  // Group ALL expenses by category for real monthly average
  const allByCategory = {}
  allExpenses.forEach(e => {
    const catId = e.categoryId || 'uncategorized'
    const catName = e.category?.name || 'ללא קטגוריה'
    if (!allByCategory[catId]) {
      allByCategory[catId] = { total: 0, count: 0, name: catName, transactions: [] }
    }
    allByCategory[catId].total += Number(e.amount)
    allByCategory[catId].count++
    allByCategory[catId].transactions.push(e)
  })

  const recommendations = []
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId).filter(Boolean))

  // ===== 1. BUDGET COMPARISON =====
  budgets.forEach(budget => {
    const budgetAmount = Number(budget.amount)
    if (budgetAmount <= 0) return
    
    const catId = budget.categoryId
    const currentSpending = catId 
      ? (currentByCategory[catId]?.total || 0)
      : currentMonthExpenses.reduce((s, e) => s + Number(e.amount), 0)
    
    const percentUsed = (currentSpending / budgetAmount) * 100
    const catName = budget.category?.name || 'כולל'

    if (percentUsed > 100) {
      recommendations.push({
        type: 'over_budget',
        categoryId: catId,
        categoryName: catName,
        monthlySpending: Math.round(currentSpending),
        budgetAmount: Math.round(budgetAmount),
        overBudgetPercentage: Math.round(percentUsed - 100),
        potentialSavings: Math.round(currentSpending - budgetAmount),
        priority: 'high',
      })
    } else if (percentUsed > 80) {
      const daysLeft = currentMonthEnd.getDate() - now.getDate()
      const remaining = budgetAmount - currentSpending
      recommendations.push({
        type: 'approaching_budget',
        categoryId: catId,
        categoryName: catName,
        monthlySpending: Math.round(currentSpending),
        budgetAmount: Math.round(budgetAmount),
        percentUsed: Math.round(percentUsed),
        remaining: Math.round(remaining),
        daysLeft,
        dailyLimit: daysLeft > 0 ? Math.round(remaining / daysLeft) : 0,
        potentialSavings: 0,
        priority: 'high',
      })
    }
  })

  // ===== 2. HIGH SPENDING CATEGORIES (this month, actual data) =====
  Object.entries(currentByCategory).forEach(([catId, current]) => {
    if (catId === 'uncategorized') return
    if (budgetedCategoryIds.has(catId)) return // Already handled in budget section
    
    const monthlyAvg = allByCategory[catId] 
      ? allByCategory[catId].total / actualMonths
      : current.total

    if (current.total > 200) {
      // Check if spending increased vs previous month
      const prev = prevByCategory[catId]
      const increase = prev && prev.total > 0
        ? Math.round(((current.total - prev.total) / prev.total) * 100)
        : null

      recommendations.push({
        type: 'high_spending',
        categoryId: catId,
        categoryName: current.name,
        monthlySpending: Math.round(current.total),
        monthlyAvg: Math.round(monthlyAvg),
        transactionCount: current.count,
        increase,
        prevMonthSpending: prev ? Math.round(prev.total) : null,
        potentialSavings: Math.round(current.total * 0.2),
        priority: current.total > 1000 ? 'high' : 'medium',
      })
    }
  })

  // ===== 3. SPENDING INCREASE vs PREVIOUS MONTH =====
  Object.entries(currentByCategory).forEach(([catId, current]) => {
    if (catId === 'uncategorized') return
    const prev = prevByCategory[catId]
    if (!prev || prev.total < 50) return

    const increase = ((current.total - prev.total) / prev.total) * 100
    // Only flag significant increases not already captured
    if (increase > 80 && current.total > 300) {
      const alreadyExists = recommendations.some(r => r.categoryId === catId)
      if (!alreadyExists) {
        recommendations.push({
          type: 'spending_increase',
          categoryId: catId,
          categoryName: current.name,
          monthlySpending: Math.round(current.total),
          prevMonthSpending: Math.round(prev.total),
          increase: Math.round(increase),
          potentialSavings: Math.round(current.total - prev.total),
          priority: increase > 150 ? 'high' : 'medium',
        })
      }
    }
  })

  // ===== 4. MANY SMALL TRANSACTIONS =====
  Object.entries(currentByCategory).forEach(([catId, current]) => {
    if (catId === 'uncategorized') return
    const avgPerTx = current.total / current.count
    
    if (current.count > 15 && avgPerTx < 40) {
      recommendations.push({
        type: 'many_small',
        categoryId: catId,
        categoryName: current.name,
        monthlySpending: Math.round(current.total),
        transactionCount: current.count,
        avgPerTransaction: Math.round(avgPerTx),
        potentialSavings: Math.round(current.total * 0.15),
        priority: 'medium',
      })
    }
  })

  // ===== 5. RECURRING EXPENSE EXCEEDS EXPECTED =====
  recurringExpenses.forEach(rec => {
    const recAmount = Number(rec.amount)
    if (recAmount <= 0) return
    
    const catId = rec.categoryId
    const current = catId ? currentByCategory[catId] : null
    if (!current) return

    if (current.total > recAmount * 1.3 && recAmount > 50) {
      const alreadyExists = recommendations.some(r => r.categoryId === catId)
      if (!alreadyExists) {
        recommendations.push({
          type: 'recurring_exceeded',
          categoryId: catId,
          categoryName: current.name || rec.description || 'הוצאה קבועה',
          monthlySpending: Math.round(current.total),
          expectedAmount: Math.round(recAmount),
          extraAmount: Math.round(current.total - recAmount),
          potentialSavings: Math.round(current.total - recAmount),
          priority: 'medium',
        })
      }
    }
  })

  // Sort by priority then by potential savings
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return (b.potentialSavings || 0) - (a.potentialSavings || 0)
    })
    .slice(0, 8)
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
