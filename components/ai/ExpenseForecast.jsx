'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function ExpenseForecast({ className }) {
  const { t, currencySymbol, formatCurrency, localeString } = useI18n()
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/ai/expense-forecast?months=3')
      if (response.ok) {
        const data = await response.json()
        setForecast(data.forecast || [])
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

  if (forecast.length === 0) {
    return null
  }

  // Find max amount for bar scaling
  const maxAmount = Math.max(...forecast.map(f => f.total))

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
          {forecast.map((month, index) => {
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
                      {month.monthName}
                      {month.isCurrent && (
                        <span className="text-xs ml-1">({t('common.current')})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[rgb(var(--text-primary))] tabular-nums">
                      {formatCurrency(month.total, { locale: localeString, symbol: currencySymbol })}
                    </span>
                    {month.trend && getTrendIcon(month.trend)}
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

                {/* Trend info */}
                {month.trend && month.trendAmount && (
                  <p className={cn(
                    "text-xs",
                    getTrendColor(month.trend)
                  )}>
                    {month.trend === 'increasing' && `+${formatCurrency(month.trendAmount, { locale: localeString, symbol: currencySymbol })} ${t('insights.expectedIncrease')}`}
                    {month.trend === 'decreasing' && `${formatCurrency(month.trendAmount, { locale: localeString, symbol: currencySymbol })} ${t('insights.expectedDecrease')}`}
                    {month.trend === 'stable' && t('insights.stable')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
