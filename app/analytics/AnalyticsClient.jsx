'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, KPICard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/Chart'
import { formatCurrency } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Lightbulb,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Sparkles,
  AlertTriangle,
  Repeat,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from 'recharts'

// Animated counter component
function AnimatedNumber({ value, duration = 1000, currencySymbol, localeString }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime
    const startValue = displayValue
    const difference = value - startValue

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(startValue + difference * easeOut)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return formatCurrency(displayValue, { locale: localeString, symbol: currencySymbol })
}

export function AnalyticsClient({
  currentDate,
  currentMonthIncome,
  currentMonthExpenses,
  prevMonthIncome,
  prevMonthExpenses,
  expensesByCategory,
  prevExpensesByCategory,
  monthlyTrends,
  dailySpending,
  spendingByDayOfWeek,
  totalBudget,
  budgetUsage,
  fixedExpenses,
  variableExpenses,
  topCategory,
  mostExpensiveDay,
  categories,
  recurringExpenses,
  recurringIncome,
}) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months')
  
  // Calculate derived values
  const netBalance = currentMonthIncome - currentMonthExpenses
  const prevNetBalance = prevMonthIncome - prevMonthExpenses
  const budgetUsagePercent = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0
  
  // Calculate percentage changes
  const incomeChange = prevMonthIncome > 0 
    ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100 
    : 0
  const expenseChange = prevMonthExpenses > 0 
    ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
    : 0
  
  // Prepare data for pie chart - translate uncategorized
  const pieData = useMemo(() => {
    return expensesByCategory
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
      .map((cat, index) => ({
        category: `cat${index}`,
        name: cat.isUncategorized || !cat.name ? t('transactions.uncategorized') : cat.name,
        value: cat.amount,
        fill: `hsl(var(--chart-${index + 1}))`,
      }))
  }, [expensesByCategory, t])

  // Chart config for pie chart (Shadcn style)
  const pieChartConfig = useMemo(() => {
    const config = {}
    pieData.forEach((item, index) => {
      config[item.category] = {
        label: item.name,
        color: `hsl(var(--chart-${index + 1}))`,
      }
    })
    return config
  }, [pieData])
  
  // Day of week data
  const dayNames = isRTL 
    ? ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const dayOfWeekData = useMemo(() => {
    return spendingByDayOfWeek.map((amount, index) => ({
      day: dayNames[index],
      amount,
    }))
  }, [spendingByDayOfWeek, dayNames])

  // Chart config for trends (Shadcn style)
  const trendsChartConfig = {
    income: {
      label: t('analytics.income'),
      color: 'hsl(142 71% 45%)',
    },
    expenses: {
      label: t('analytics.expenses'),
      color: 'hsl(0 84% 60%)',
    },
  }

  // Chart config for day of week
  const dayChartConfig = {
    amount: {
      label: t('analytics.spending'),
      color: 'hsl(262 83% 58%)',
    },
  }

  // Monthly expenses data for horizontal bar chart (last 5 months)
  const monthlyExpensesData = useMemo(() => {
    const monthNames = isRTL 
      ? ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return monthlyTrends
      .slice(-5) // Last 5 months
      .map(trend => {
        // Extract month number from the trend (monthNum is 0-11)
        const monthIndex = trend.monthNum
        const monthName = monthNames[monthIndex] || trend.month.slice(0, 3)
        
        return {
          month: monthName,
          monthFull: trend.month,
          expenses: trend.expenses,
        }
      })
      .reverse() // Show oldest to newest (left to right)
  }, [monthlyTrends, isRTL])

  // Chart config for monthly expenses
  const monthlyExpensesChartConfig = {
    expenses: {
      label: t('analytics.expenses'),
      color: 'hsl(0 84% 60%)',
    },
  }
  
  // Fixed vs Variable totals
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalVariable = variableExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Generate smart insights
  const insights = []
  
  // Expense change insight
  if (Math.abs(expenseChange) >= 10) {
    insights.push({
      type: expenseChange > 0 ? 'warning' : 'success',
      icon: expenseChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      title: expenseChange > 0 ? t('analytics.spendingIncreased') : t('analytics.spendingDecreased'),
      description: t('analytics.expenseChangeDesc', { 
        percent: Math.abs(expenseChange).toFixed(0),
        direction: expenseChange > 0 ? t('analytics.more') : t('analytics.less')
      }),
    })
  }
  
  // Top category insight
  if (topCategory && currentMonthExpenses > 0) {
    const topPercent = ((topCategory.amount / currentMonthExpenses) * 100).toFixed(0)
    const categoryName = topCategory.isUncategorized || !topCategory.name 
      ? t('transactions.uncategorized') 
      : topCategory.name
    insights.push({
      type: 'info',
      icon: <PieChart className="w-5 h-5" />,
      title: t('analytics.topCategoryInsight'),
      description: t('analytics.topCategoryDesc', { 
        category: categoryName,
        percent: topPercent
      }),
    })
  }
  
  // Most expensive day insight
  if (mostExpensiveDay.amount > 0) {
    insights.push({
      type: 'info',
      icon: <Calendar className="w-5 h-5" />,
      title: t('analytics.mostExpensiveDayInsight'),
      description: t('analytics.mostExpensiveDayDesc', { 
        day: isRTL ? dayNames[mostExpensiveDay.index] : mostExpensiveDay.name
      }),
    })
  }
  
  // Budget warning
  if (budgetUsagePercent >= 80 && totalBudget > 0) {
    insights.push({
      type: budgetUsagePercent >= 100 ? 'danger' : 'warning',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: budgetUsagePercent >= 100 ? t('analytics.budgetExceeded') : t('analytics.budgetWarning'),
      description: t('analytics.budgetWarningDesc', { 
        percent: budgetUsagePercent.toFixed(0)
      }),
    })
  }
  
  // Fixed expenses insight
  if (totalFixed > 0 && currentMonthExpenses > 0) {
    const fixedPercent = ((totalFixed / currentMonthExpenses) * 100).toFixed(0)
    insights.push({
      type: 'info',
      icon: <Repeat className="w-5 h-5" />,
      title: t('analytics.fixedExpensesInsight'),
      description: t('analytics.fixedExpensesDesc', { percent: fixedPercent }),
    })
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">
              {t('analytics.title')}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {new Date(currentDate).toLocaleDateString(localeString, { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <KPICard
          title={t('analytics.totalIncome')}
          value={<AnimatedNumber value={currentMonthIncome} currencySymbol={currencySymbol} localeString={localeString} />}
          subtitle={
            incomeChange !== 0 
              ? `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(0)}% ${t('analytics.vsLastMonth')}`
              : t('analytics.thisMonth')
          }
          icon={<ArrowUpCircle className="w-5 h-5" />}
          variant="income"
        />
        
        <KPICard
          title={t('analytics.totalExpenses')}
          value={<AnimatedNumber value={currentMonthExpenses} currencySymbol={currencySymbol} localeString={localeString} />}
          subtitle={
            expenseChange !== 0 
              ? `${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(0)}% ${t('analytics.vsLastMonth')}`
              : t('analytics.thisMonth')
          }
          icon={<ArrowDownCircle className="w-5 h-5" />}
          variant="expense"
        />
        
        <KPICard
          title={t('analytics.netBalance')}
          value={<AnimatedNumber value={netBalance} currencySymbol={currencySymbol} localeString={localeString} />}
          subtitle={t('analytics.incomeMinusExpenses')}
          icon={netBalance >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          variant={netBalance >= 0 ? 'net' : 'netNegative'}
        />
        
        <KPICard
          title={t('analytics.budgetUsage')}
          value={`${budgetUsagePercent.toFixed(0)}%`}
          subtitle={
            totalBudget > 0 
              ? `${formatCurrency(currentMonthExpenses, { locale: localeString, symbol: currencySymbol })} / ${formatCurrency(totalBudget, { locale: localeString, symbol: currencySymbol })}`
              : t('analytics.noBudgetSet')
          }
          icon={<Target className="w-5 h-5" />}
          variant={budgetUsagePercent > 100 ? 'expense' : budgetUsagePercent > 80 ? 'netNegative' : 'balance'}
        />
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card className="overflow-hidden !p-0">
          <div className="p-5 border-b border-light-border/50 dark:border-dark-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {t('analytics.smartInsights')}
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  {t('analytics.smartInsightsDesc')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-light-border/50 dark:divide-dark-border/50">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-5 hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  insight.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                  insight.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                  insight.type === 'danger' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' :
                  'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                }`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Expense Trend Chart */}
        <Card className="col-span-1 lg:col-span-2 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 lg:mb-6">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-[rgb(var(--text-primary))]">
                {t('analytics.expenseTrends')}
              </h2>
              <p className="text-xs lg:text-sm text-[rgb(var(--text-tertiary))]">
                {t('analytics.last6Months')}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={selectedTimeRange === '6months' ? 'default' : 'secondary'} 
                     className="cursor-pointer text-xs"
                     onClick={() => setSelectedTimeRange('6months')}>
                6 {t('analytics.months')}
              </Badge>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <ChartContainer config={trendsChartConfig} className="h-48 sm:h-64 lg:h-72 min-w-[400px] w-full">
              <AreaChart data={monthlyTrends} accessibilityLayer>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgb(var(--border-primary))" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: 'rgb(var(--text-tertiary))' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'rgb(var(--text-tertiary))' }}
                  width={40}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span>{trendsChartConfig[name]?.label || name}</span>
                          <span className="font-bold">{formatCurrency(value, { locale: localeString, symbol: currencySymbol })}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area 
                  type="natural" 
                  dataKey="income" 
                  stroke="var(--color-income)" 
                  strokeWidth={2}
                  fill="url(#fillIncome)" 
                  stackId="a"
                />
                <Area 
                  type="natural" 
                  dataKey="expenses" 
                  stroke="var(--color-expenses)" 
                  strokeWidth={2}
                  fill="url(#fillExpenses)" 
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </Card>

        {/* Category Breakdown - Donut Chart with Center Label */}
        <Card className="flex flex-col overflow-hidden">
          <div className="mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('analytics.categoryBreakdown')}
            </h2>
            <p className="text-xs lg:text-sm text-[rgb(var(--text-tertiary))]">
              {t('analytics.expensesByCategory')}
            </p>
          </div>
          
          {pieData.length > 0 ? (
            <div className="flex flex-col flex-1">
              <ChartContainer config={pieChartConfig} className="mx-auto aspect-square h-[180px] sm:h-[220px]">
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent 
                        hideLabel
                        formatter={(value, name, item) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[rgb(var(--text-tertiary))]">
                              {item.payload.name}
                            </span>
                            <span className="font-bold text-[rgb(var(--text-primary))]">
                              {formatCurrency(value, { locale: localeString, symbol: currencySymbol })}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">
                              {((value / currentMonthExpenses) * 100).toFixed(1)}% {t('analytics.ofTotal')}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy - 4}
                                className="fill-[rgb(var(--text-primary))] text-base sm:text-lg font-bold"
                              >
                                {formatCurrency(currentMonthExpenses, { locale: localeString, symbol: currencySymbol })}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                className="fill-[rgb(var(--text-tertiary))] text-[10px] sm:text-xs"
                              >
                                {t('analytics.totalExpenses')}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>
              
              {/* Category Legend */}
              <div className="mt-4 space-y-1.5">
                {pieData.map((cat, index) => {
                  const percent = ((cat.value / currentMonthExpenses) * 100).toFixed(0)
                  return (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors cursor-default"
                    >
                      <div 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: cat.fill }}
                      />
                      <span className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] flex-1 truncate">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))] tabular-nums">
                          {formatCurrency(cat.value, { locale: localeString, symbol: currencySymbol })}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[rgb(var(--text-tertiary))] w-8 sm:w-10 text-end tabular-nums">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-[rgb(var(--text-tertiary))]">
              {t('analytics.noExpensesYet')}
            </div>
          )}
        </Card>

        {/* Spending by Day of Week */}
        <Card className="overflow-hidden">
          <div className="mb-4 lg:mb-6">
            <h2 className="text-base lg:text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('analytics.spendingByDay')}
            </h2>
            <p className="text-xs lg:text-sm text-[rgb(var(--text-tertiary))]">
              {t('analytics.weeklyPattern')}
            </p>
          </div>
          
          <div className="w-full overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <ChartContainer config={dayChartConfig} className="h-48 sm:h-56 lg:h-64 min-w-[300px] w-full">
              <BarChart data={dayOfWeekData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgb(var(--border-primary))" />
                <XAxis 
                  dataKey="day" 
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'rgb(var(--text-tertiary))' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: 'rgb(var(--text-tertiary))' }}
                  width={35}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent 
                      formatter={(value) => (
                        <span className="font-bold">
                          {formatCurrency(value, { locale: localeString, symbol: currencySymbol })}
                        </span>
                      )}
                    />
                  }
                />
                <Bar 
                  dataKey="amount" 
                  fill="var(--color-amount)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>

      {/* Budget vs Actual */}
      {budgetUsage.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {t('analytics.budgetVsActual')}
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('analytics.budgetProgress')}
              </p>
            </div>
          </div>
          
          <div className="space-y-5">
            {budgetUsage.sort((a, b) => b.percentage - a.percentage).map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: budget.categoryColor }}
                    />
                    <span className="font-medium text-[rgb(var(--text-primary))]">
                      {budget.isUncategorized || !budget.categoryName ? t('transactions.uncategorized') : budget.categoryName}
                    </span>
                    {budget.percentage >= 100 && (
                      <Badge variant="destructive" className="text-xs">
                        {t('analytics.exceeded')}
                      </Badge>
                    )}
                    {budget.percentage >= 80 && budget.percentage < 100 && (
                      <Badge variant="warning" className="text-xs">
                        {t('analytics.nearLimit')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-[rgb(var(--text-secondary))]">
                    {formatCurrency(budget.spent, { locale: localeString, symbol: currencySymbol })} / {formatCurrency(budget.budget, { locale: localeString, symbol: currencySymbol })}
                  </div>
                </div>
                <Progress value={budget.spent} max={budget.budget} />
                <div className="flex justify-between text-xs text-[rgb(var(--text-tertiary))]">
                  <span>{budget.percentage.toFixed(0)}% {t('analytics.used')}</span>
                  <span>
                    {budget.remaining >= 0 
                      ? `${formatCurrency(budget.remaining, { locale: localeString, symbol: currencySymbol })} ${t('analytics.remaining')}`
                      : `${formatCurrency(Math.abs(budget.remaining), { locale: localeString, symbol: currencySymbol })} ${t('analytics.over')}`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fixed vs Variable Expenses */}
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('analytics.fixedVsVariable')}
          </h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {t('analytics.fixedVsVariableDesc')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fixed Expenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {t('analytics.fixedExpenses')}
                  </span>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('analytics.fixedExpensesHint')}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
                {formatCurrency(totalFixed, { locale: localeString, symbol: currencySymbol })}
              </span>
            </div>
            
            {fixedExpenses.length > 0 ? (
              <div className="space-y-2">
                {fixedExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b border-light-border-light dark:border-dark-border-light last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.color }} />
                      <span className="text-sm text-[rgb(var(--text-secondary))]">
                        {expense.isUncategorized || !expense.name ? t('transactions.uncategorized') : expense.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {formatCurrency(expense.amount, { locale: localeString, symbol: currencySymbol })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--text-tertiary))] py-4 text-center">
                {t('analytics.noFixedExpenses')}
              </p>
            )}
          </div>
          
          {/* Variable Expenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {t('analytics.variableExpenses')}
                  </span>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('analytics.variableExpensesHint')}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
                {formatCurrency(totalVariable, { locale: localeString, symbol: currencySymbol })}
              </span>
            </div>
            
            {variableExpenses.length > 0 ? (
              <div className="space-y-2">
                {variableExpenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b border-light-border-light dark:border-dark-border-light last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.color }} />
                      <span className="text-sm text-[rgb(var(--text-secondary))]">
                        {expense.isUncategorized || !expense.name ? t('transactions.uncategorized') : expense.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {formatCurrency(expense.amount, { locale: localeString, symbol: currencySymbol })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--text-tertiary))] py-4 text-center">
                {t('analytics.noVariableExpenses')}
              </p>
            )}
          </div>
        </div>
        
        {/* Summary Bar */}
        {currentMonthExpenses > 0 && (
          <div className="mt-6 pt-6 border-t border-[rgb(var(--border-primary))]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                {t('analytics.expenseComposition')}
              </span>
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                {((totalFixed / currentMonthExpenses) * 100).toFixed(0)}% {t('analytics.fixed')} / {((totalVariable / currentMonthExpenses) * 100).toFixed(0)}% {t('analytics.variable')}
              </span>
            </div>
            <div className="h-3 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(totalFixed / currentMonthExpenses) * 100}%` }}
              />
              <div 
                className="bg-purple-500 transition-all duration-500"
                style={{ width: `${(totalVariable / currentMonthExpenses) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {expensesByCategory.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--bg-tertiary))] flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
            {t('analytics.noDataYet')}
          </h3>
          <p className="text-[rgb(var(--text-secondary))] max-w-md mx-auto">
            {t('analytics.noDataDesc')}
          </p>
        </Card>
      )}
    </div>
  )
}

