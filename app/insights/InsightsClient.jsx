'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { 
  Lightbulb, 
  TrendingDown, 
  AlertTriangle, 
  TrendingUp,
  Sparkles,
  Target,
  DollarSign,
  Calendar
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency } from '@/lib/utils'

export function InsightsClient() {
  const { t, currencySymbol, localeString } = useI18n()
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
      setForecast(forecastData.forecast || [])
    } catch (error) {
      console.error('Error loading insights:', error)
      toast.error(t('common.error'), 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      default: return 'default'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-light-danger dark:text-dark-danger" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-light-success dark:text-dark-success" />
      default: return <Target className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 lg:mb-2">
          {t('insights.title')}
        </h1>
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          {t('insights.subtitle')}
        </p>
      </div>

      {/* Savings Recommendations */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <div className="w-10 h-10 rounded-xl bg-light-success-light dark:bg-dark-success-light flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-light-success dark:text-dark-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              {t('insights.savingsRecommendations')}
            </h2>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {t('insights.savingsDescription')}
            </p>
          </div>
        </div>

        {savings.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8" />}
            title={t('insights.noSavingsRecommendations')}
            description={t('insights.noSavingsDescription')}
          />
        ) : (
          <div className="space-y-3">
            {savings.map((rec, index) => (
              <div
                key={index}
                className="p-4 border border-light-border-light dark:border-dark-border-light rounded-xl bg-light-surface dark:bg-dark-surface"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority === 'high' ? t('insights.highPriority') : 
                         rec.priority === 'medium' ? t('insights.mediumPriority') : 
                         t('insights.lowPriority')}
                      </Badge>
                      <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        {rec.categoryName}
                      </span>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {rec.message}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-semibold text-light-success dark:text-dark-success">
                      {formatCurrency(rec.potentialSavings, { locale: localeString, symbol: currencySymbol })}
                    </div>
                    <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      {t('insights.potentialSavings')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Anomalies / Suspicious Activity */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <div className="w-10 h-10 rounded-xl bg-light-warning-light dark:bg-dark-warning-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-light-warning dark:text-dark-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              {t('insights.suspiciousActivity')}
            </h2>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {t('insights.anomaliesDescription')}
            </p>
          </div>
        </div>

        {anomalies.length === 0 ? (
          <EmptyState
            icon={<Target className="w-8 h-8" />}
            title={t('insights.noAnomalies')}
            description={t('insights.noAnomaliesDescription')}
          />
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="p-4 border border-light-border-light dark:border-dark-border-light rounded-xl bg-light-surface dark:bg-dark-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(anomaly.severity)} className="text-xs">
                        {anomaly.severity === 'high' ? t('insights.highSeverity') : 
                         anomaly.severity === 'medium' ? t('insights.mediumSeverity') : 
                         t('insights.lowSeverity')}
                      </Badge>
                      <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        {anomaly.type === 'high_daily_spending' && t('insights.highDailySpending')}
                        {anomaly.type === 'unusual_transaction' && t('insights.unusualTransaction')}
                        {anomaly.type === 'unusual_time' && t('insights.unusualTime')}
                      </span>
                    </div>
                    {anomaly.description && (
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        {anomaly.description}
                      </p>
                    )}
                    {anomaly.date && (
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                        {new Date(anomaly.date).toLocaleDateString(localeString)}
                      </p>
                    )}
                  </div>
                  {anomaly.amount && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {formatCurrency(anomaly.amount, { locale: localeString, symbol: currencySymbol })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Expense Forecast */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-light-accent dark:text-dark-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              {t('insights.expenseForecast')}
            </h2>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {t('insights.forecastDescription')}
            </p>
          </div>
        </div>

        {forecast.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8" />}
            title={t('insights.noForecast')}
            description={t('insights.noForecastDescription')}
          />
        ) : (
          <div className="space-y-4">
            {forecast.map((month, index) => (
              <div
                key={index}
                className="p-4 border border-light-border-light dark:border-dark-border-light rounded-xl bg-light-surface dark:bg-dark-surface"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {month.monthName}
                    </h3>
                    {month.trend && (
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(month.trend)}
                        <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          {month.trend === 'increasing' && t('insights.trendIncreasing')}
                          {month.trend === 'decreasing' && t('insights.trendDecreasing')}
                          {month.trend === 'stable' && t('insights.trendStable')}
                          {month.trendAmount && month.trendAmount !== 0 && (
                            <span className="ml-1">
                              ({formatCurrency(Math.abs(month.trendAmount), { locale: localeString, symbol: currencySymbol })})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      {formatCurrency(month.total, { locale: localeString, symbol: currencySymbol })}
                    </div>
                    <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      {t('insights.forecastedTotal')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={loadInsights}
          disabled={loading}
          loading={loading}
        >
          {t('insights.refresh')}
        </Button>
      </div>
    </div>
  )
}

