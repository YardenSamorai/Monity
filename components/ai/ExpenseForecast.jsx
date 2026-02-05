'use client'

import { useState, useEffect } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  Calendar,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function ExpenseForecast({ className }) {
  const { t, currencySymbol, localeString, locale } = useI18n()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/ai/expense-forecast?months=3')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-emerald-500" />
      default:
        return <Minus className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-500'
      case 'decreasing':
        return 'text-emerald-500'
      default:
        return 'text-[rgb(var(--text-tertiary))]'
    }
  }

  // Get month name based on locale
  const getMonthName = (month) => {
    const isHebrew = locale === 'he'
    return isHebrew ? month.monthName : month.monthNameEn
  }

  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-tertiary))] animate-pulse" />
          <div className="h-5 w-32 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-[rgb(var(--bg-tertiary))] rounded-lg animate-pulse" />
          <div className="h-12 bg-[rgb(var(--bg-tertiary))] rounded-lg animate-pulse" />
          <div className="h-12 bg-[rgb(var(--bg-tertiary))] rounded-lg animate-pulse" />
        </div>
      </Card>
    )
  }

  if (!data || !data.forecast || data.forecast.length === 0) {
    return null
  }

  // Not enough data - show message
  if (!data.hasEnoughData) {
    return (
      <Card className={cn("p-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                {t('ai.expenseForecast')}
              </h3>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('insights.nextMonths')}
              </p>
            </div>
          </div>
        </div>

        {/* Not enough data message */}
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="font-medium text-[rgb(var(--text-primary))] mb-1">
            {t('ai.needMoreData')}
          </h4>
          <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-xs">
            {t('ai.needMoreDataDescription', {
              current: data.currentTransactions || 0,
              needed: data.minTransactionsNeeded || 10,
              months: data.minMonthsNeeded || 2,
            })}
          </p>
          
          {/* Show current month only */}
          {data.forecast[0] && (
            <div className="mt-4 w-full p-3 bg-[rgb(var(--bg-tertiary))] rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
                  <span className="font-medium text-[rgb(var(--accent))]">
                    {getMonthName(data.forecast[0])} ({t('common.current')})
                  </span>
                </div>
                <span className="font-semibold text-[rgb(var(--text-primary))] tabular-nums">
                  {formatCurrency(data.forecast[0].total, { locale: localeString, symbol: currencySymbol })}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Find max amount for bar scaling
  const maxAmount = Math.max(...data.forecast.map(f => f.total))

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('ai.expenseForecast')}
            </h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('insights.nextMonths')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
        >
          <ChevronRight className={cn(
            "w-5 h-5 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </button>
      </div>

      {/* Forecast Chart */}
      {isExpanded && (
        <div className="space-y-3">
          {data.forecast.map((month, index) => {
            const percentage = maxAmount > 0 ? (month.total / maxAmount) * 100 : 0
            
            return (
              <div key={`${month.year}-${month.month}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                    <span className={cn(
                      "font-medium",
                      month.isCurrent 
                        ? "text-[rgb(var(--accent))]" 
                        : "text-[rgb(var(--text-secondary))]"
                    )}>
                      {getMonthName(month)}
                      {month.isCurrent && (
                        <span className="text-xs ms-1">({t('common.current')})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[rgb(var(--text-primary))] tabular-nums">
                      {formatCurrency(month.total, { locale: localeString, symbol: currencySymbol })}
                    </span>
                    {!month.isCurrent && month.trend && getTrendIcon(month.trend)}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      month.isCurrent 
                        ? "bg-[rgb(var(--accent))]"
                        : index === 1
                        ? "bg-violet-500"
                        : index === 2
                        ? "bg-purple-500"
                        : "bg-purple-600"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Confidence indicator for forecast months */}
                {!month.isCurrent && month.confidence && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('ai.forecastConfidence')}: {Math.round(month.confidence * 100)}%
                  </p>
                )}

                {/* Trend info */}
                {!month.isCurrent && month.trend && month.trendAmount !== 0 && (
                  <p className={cn(
                    "text-xs",
                    getTrendColor(month.trend)
                  )}>
                    {month.trend === 'increasing' && `+${formatCurrency(Math.abs(month.trendAmount), { locale: localeString, symbol: currencySymbol })} ${t('insights.expectedIncrease')}`}
                    {month.trend === 'decreasing' && `-${formatCurrency(Math.abs(month.trendAmount), { locale: localeString, symbol: currencySymbol })} ${t('insights.expectedDecrease')}`}
                    {month.trend === 'stable' && t('insights.stable')}
                  </p>
                )}
              </div>
            )
          })}

          {/* Historical info */}
          {data.historicalAverage > 0 && (
            <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary))]">
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('ai.basedOnHistory', { months: data.dataMonths || 0 })} • {t('ai.historicalAverage')}: {formatCurrency(data.historicalAverage, { locale: localeString, symbol: currencySymbol })}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
