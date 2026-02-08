'use client'

import { useState, useEffect } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Lightbulb, 
  ChevronRight,
  X,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function SmartTips({ className }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissedTips, setDismissedTips] = useState([])
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('monity_dismissed_tips')
    if (saved) {
      try { setDismissedTips(JSON.parse(saved)) } catch { setDismissedTips([]) }
    }
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      const response = await fetch('/api/ai/smart-tips', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setTips(data.tips || [])
      }
    } catch (error) {
      console.error('Error fetching tips:', error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time updates
  useDataRefresh({
    key: 'smart-tips',
    fetchFn: fetchTips,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const dismissTip = (tipId) => {
    const newDismissed = [...dismissedTips, tipId]
    setDismissedTips(newDismissed)
    localStorage.setItem('monity_dismissed_tips', JSON.stringify(newDismissed))
  }

  const getTranslatedMessage = (tip) => {
    if (!tip.messageKey) return tip.message || ''
    let message = t(tip.messageKey)
    if (tip.messageData) {
      Object.entries(tip.messageData).forEach(([key, value]) => {
        if (['amount', 'budget', 'overAmount', 'remaining', 'dailyLimit', 'currentAmount', 'prevAmount', 'savedAmount', 'expected', 'actual', 'extra', 'suggestedBudget', 'projected', 'prevMonth', 'dailyAvg', 'excess', 'expenses', 'income', 'monthlyNeeded'].includes(key)) {
          const formatted = formatCurrency(value, { locale: localeString, symbol: currencySymbol })
          message = message.replace(`{${key}}`, formatted)
        } else {
          message = message.replace(`{${key}}`, value)
        }
      })
    }
    return message
  }

  const getTranslatedTitle = (tip) => {
    if (!tip.titleKey) return tip.title || ''
    return t(tip.titleKey)
  }

  const visibleTips = tips.filter(tip => !dismissedTips.includes(tip.id))

  const getTypeConfig = (type) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800/50',
          iconBg: 'bg-rose-100 dark:bg-rose-900/40',
          iconColor: 'text-rose-600 dark:text-rose-400',
          titleColor: 'text-rose-700 dark:text-rose-400',
          StatusIcon: Shield,
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800/50',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
          titleColor: 'text-amber-700 dark:text-amber-400',
          StatusIcon: TrendingUp,
        }
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800/50',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          titleColor: 'text-emerald-700 dark:text-emerald-400',
          StatusIcon: TrendingDown,
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800/50',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-700 dark:text-blue-400',
          StatusIcon: Lightbulb,
        }
    }
  }

  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-tertiary))] animate-pulse" />
          <div className="h-5 w-32 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-20 bg-[rgb(var(--bg-tertiary))] rounded-xl animate-pulse" />
          <div className="h-20 bg-[rgb(var(--bg-tertiary))] rounded-xl animate-pulse" />
        </div>
      </Card>
    )
  }

  if (visibleTips.length === 0) return null

  return (
    <Card className={cn("overflow-hidden", className)} padding={false}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="text-start">
            <h3 className="font-semibold text-sm text-[rgb(var(--text-primary))]">
              {t('ai.smartTips')}
            </h3>
            <p className="text-[11px] text-[rgb(var(--text-tertiary))]">
              {visibleTips.length} {t('ai.insightsAvailable')}
            </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "w-5 h-5 text-[rgb(var(--text-tertiary))] transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      {/* Tips List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2.5">
          {visibleTips.map((tip) => {
            const config = getTypeConfig(tip.type)
            
            return (
              <div
                key={tip.id}
                className={cn(
                  "relative p-3.5 rounded-xl border transition-all",
                  config.bg,
                  config.border,
                )}
              >
                <button
                  onClick={() => dismissTip(tip.id)}
                  className="absolute top-2.5 end-2.5 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                </button>

                <div className="flex gap-3 pe-6">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <span className="text-lg">{tip.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("font-semibold text-sm mb-1", config.titleColor)}>
                      {getTranslatedTitle(tip)}
                    </h4>
                    <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                      {getTranslatedMessage(tip)}
                    </p>
                    
                    {tip.potentialSavings > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 w-fit">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {t('ai.savePotential')}: {formatCurrency(tip.potentialSavings, { locale: localeString, symbol: currencySymbol })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
