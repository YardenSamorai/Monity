'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { 
  Lightbulb, 
  TrendingDown, 
  AlertTriangle, 
  TrendingUp,
  Sparkles,
  Target,
  Calendar,
  RefreshCw,
  PiggyBank,
  ArrowRight,
  ChevronRight,
  Zap,
  ShieldAlert,
  BarChart3
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, cn } from '@/lib/utils'

export function InsightsClient() {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savings, setSavings] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const [savingsRes, anomaliesRes, forecastRes] = await Promise.all([
        fetch('/api/insights/savings'),
        fetch('/api/insights/anomalies'),
        fetch('/api/insights/forecast?months=3'),
      ])

      const savingsData = await savingsRes.json()
      const anomaliesData = await anomaliesRes.json()
      const forecastData = await forecastRes.json()

      setSavings(savingsData.recommendations || [])
      setAnomalies(anomaliesData.anomalies || [])
      // forecastExpenses returns { hasEnoughData, forecast: [...] }
      const forecastResult = forecastData.forecast || {}
      setForecast(Array.isArray(forecastResult) ? forecastResult : (forecastResult.forecast || []))
    } catch (error) {
      console.error('Error loading insights:', error)
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': 
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/20'
        }
      case 'medium': 
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/20'
        }
      default: 
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/20'
        }
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return t('insights.highPriority')
      case 'medium': return t('insights.mediumPriority')
      default: return t('insights.lowPriority')
    }
  }

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return t('insights.highSeverity')
      case 'medium': return t('insights.mediumSeverity')
      default: return t('insights.lowSeverity')
    }
  }

  const getAnomalyTypeLabel = (type) => {
    switch (type) {
      case 'high_daily_spending': return t('insights.highDailySpending')
      case 'unusual_transaction': return t('insights.unusualTransaction')
      case 'unusual_time': return t('insights.unusualTime')
      default: return type
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': 
        return <TrendingUp className="w-4 h-4 text-rose-500" />
      case 'decreasing': 
        return <TrendingDown className="w-4 h-4 text-emerald-500" />
      default: 
        return <Target className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
    }
  }

  const getTrendLabel = (trend) => {
    switch (trend) {
      case 'increasing': return t('insights.trendIncreasing')
      case 'decreasing': return t('insights.trendDecreasing')
      case 'stable': return t('insights.trendStable')
      default: return ''
    }
  }

  // Calculate totals for the summary
  const totalPotentialSavings = savings.reduce((sum, s) => sum + (s.potentialSavings || 0), 0)
  const highPriorityCount = savings.filter(s => s.priority === 'high').length
  const anomalyCount = anomalies.length

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {t('insights.title')}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {t('insights.subtitle')}
            </p>
          </div>
          <button
            onClick={loadInsights}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
              {formatCurrency(totalPotentialSavings, { locale: localeString, symbol: currencySymbol })}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('insights.potentialSavings')}
            </p>
          </div>
          
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center mx-auto mb-2">
              <Lightbulb className="w-5 h-5 text-[rgb(var(--accent))]" />
            </div>
            <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
              {savings.length}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('insights.recommendations')}
            </p>
          </div>
          
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
              anomalyCount > 0 ? "bg-amber-500/10 dark:bg-amber-500/20" : "bg-emerald-500/10 dark:bg-emerald-500/20"
            )}>
              <ShieldAlert className={cn(
                "w-5 h-5",
                anomalyCount > 0 ? "text-amber-500" : "text-emerald-500"
              )} />
            </div>
            <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
              {anomalyCount}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('insights.anomaliesFound')}
            </p>
          </div>
        </div>

        {/* Savings Recommendations */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {t('insights.savingsRecommendations')}
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  {t('insights.savingsDescription')}
                </p>
              </div>
            </div>
          </div>

          {savings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--bg-tertiary))] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[rgb(var(--text-tertiary))]" />
              </div>
              <p className="font-medium text-[rgb(var(--text-primary))] mb-1">
                {t('insights.noSavingsRecommendations')}
              </p>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('insights.noSavingsDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {savings.map((rec, index) => {
                const styles = getPriorityStyles(rec.priority)
                return (
                  <div key={index} className="p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("px-2 py-1 rounded-lg text-xs font-medium", styles.bg, styles.text)}>
                        {getPriorityLabel(rec.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[rgb(var(--text-primary))] mb-1">
                          {rec.categoryName || t('transactions.uncategorized')}
                        </p>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">
                          {t('insights.spendingMessage', {
                            amount: formatCurrency(rec.monthlySpending || 0, { locale: localeString, symbol: currencySymbol }),
                            category: rec.categoryName || t('transactions.uncategorized')
                          })}
                        </p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                          {formatCurrency(rec.potentialSavings, { locale: localeString, symbol: currencySymbol })}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                          {t('insights.potentialSavings')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Anomalies / Suspicious Activity */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {t('insights.suspiciousActivity')}
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  {t('insights.anomaliesDescription')}
                </p>
              </div>
            </div>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-medium text-[rgb(var(--text-primary))] mb-1">
                {t('insights.noAnomalies')}
              </p>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('insights.noAnomaliesDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {anomalies.map((anomaly, index) => {
                const styles = getPriorityStyles(anomaly.severity)
                return (
                  <div key={index} className="p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("px-2 py-1 rounded-lg text-xs font-medium", styles.bg, styles.text)}>
                        {getSeverityLabel(anomaly.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[rgb(var(--text-primary))] mb-1">
                          {getAnomalyTypeLabel(anomaly.type)}
                        </p>
                        {anomaly.date && (
                          <p className="text-sm text-[rgb(var(--text-tertiary))]">
                            {new Date(anomaly.date).toLocaleDateString(localeString, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      {anomaly.amount && (
                        <div className="text-end flex-shrink-0">
                          <p className="font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                            {formatCurrency(anomaly.amount, { locale: localeString, symbol: currencySymbol })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Expense Forecast */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[rgb(var(--accent))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {t('insights.expenseForecast')}
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  {t('insights.forecastDescription')}
                </p>
              </div>
            </div>
          </div>

          {forecast.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--bg-tertiary))] flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-[rgb(var(--text-tertiary))]" />
              </div>
              <p className="font-medium text-[rgb(var(--text-primary))] mb-1">
                {t('insights.noForecast')}
              </p>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('insights.noForecastDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {forecast.map((month, index) => (
                <div key={index} className="p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[rgb(var(--text-primary))]">
                        {month.monthName}
                      </p>
                      {month.trend && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {getTrendIcon(month.trend)}
                          <span className={cn(
                            "text-xs",
                            month.trend === 'increasing' ? "text-rose-500" : 
                            month.trend === 'decreasing' ? "text-emerald-500" : 
                            "text-[rgb(var(--text-tertiary))]"
                          )}>
                            {getTrendLabel(month.trend)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                      <p className="text-xl font-bold text-[rgb(var(--text-primary))]" dir="ltr">
                        {formatCurrency(month.total, { locale: localeString, symbol: currencySymbol })}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {t('insights.forecastedExpenses')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
