'use client'

import { useState, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { TrendingUp, Calendar, Sparkles } from 'lucide-react'

export function ForecastPanel({ goal }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [additionalMonthly, setAdditionalMonthly] = useState(0)

  const remaining = goal.targetAmount - goal.savedAmount
  const currentMonthly = goal.fixedMonthlyAmount || 0
  const totalMonthly = currentMonthly + additionalMonthly

  const forecast = useMemo(() => {
    if (!goal.targetDate || totalMonthly <= 0) return null

    const today = new Date()
    const targetDate = new Date(goal.targetDate)
    const monthsLeft = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)))
    
    const requiredMonthly = remaining / monthsLeft
    const newMonthsNeeded = totalMonthly > 0 ? Math.ceil(remaining / totalMonthly) : monthsLeft
    const estimatedDate = new Date(today)
    estimatedDate.setMonth(estimatedDate.getMonth() + newMonthsNeeded)
    
    const monthsDifference = monthsLeft - newMonthsNeeded

    return {
      requiredMonthly,
      newMonthsNeeded,
      estimatedDate,
      monthsDifference,
      isFaster: monthsDifference > 0,
    }
  }, [goal, remaining, totalMonthly])

  return (
    <div className="p-6 bg-light-surface/50 dark:bg-dark-surface/50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-light-accent dark:text-dark-accent" />
        <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
          {t('goals.whatIf')}
        </h4>
      </div>

      <div className="space-y-4">
        {/* Slider */}
        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            {t('goals.additionalMonthly')}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={additionalMonthly}
              onChange={(e) => setAdditionalMonthly(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-light-border dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-light-accent dark:accent-dark-accent"
            />
            <div className="w-24 text-right font-semibold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
              {formatCurrency(additionalMonthly, { locale: localeString, symbol: currencySymbol })}
            </div>
          </div>
          <div className="flex justify-between text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            <span>{formatCurrency(0, { locale: localeString, symbol: currencySymbol })}</span>
            <span>{formatCurrency(5000, { locale: localeString, symbol: currencySymbol })}</span>
          </div>
        </div>

        {/* Current vs New */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('goals.currentMonthly')}
            </div>
            <div className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
              {formatCurrency(currentMonthly, { locale: localeString, symbol: currencySymbol })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('goals.newMonthly')}
            </div>
            <div className="text-lg font-bold text-light-accent dark:text-dark-accent" dir="ltr">
              {formatCurrency(totalMonthly, { locale: localeString, symbol: currencySymbol })}
            </div>
          </div>
        </div>

        {/* Forecast Results */}
        {forecast && (
          <div className="space-y-3 pt-4 border-t border-light-border dark:border-dark-border">
            {forecast.isFaster && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {t('goals.fasterCompletion')}
                  </span>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {t('goals.monthsEarlier', { months: forecast.monthsDifference })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {t('goals.estimatedCompletion')}
                </span>
                <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {formatDate(forecast.estimatedDate.toISOString(), 'short', { locale: localeString })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                  {t('goals.monthsNeeded')}
                </span>
                <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {forecast.newMonthsNeeded} {t('goals.months')}
                </span>
              </div>
            </div>
          </div>
        )}

        {!forecast && (
          <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary text-center py-4">
            {t('goals.noTargetDate')}
          </div>
        )}
      </div>
    </div>
  )
}

