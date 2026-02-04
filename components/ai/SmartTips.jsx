'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingDown, 
  ChevronRight,
  X,
  Sparkles,
  PiggyBank
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function SmartTips({ className }) {
  const { t, currencySymbol, formatCurrency, localeString } = useI18n()
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissedTips, setDismissedTips] = useState([])
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // Load dismissed tips from localStorage
    const saved = localStorage.getItem('monity_dismissed_tips')
    if (saved) {
      try {
        setDismissedTips(JSON.parse(saved))
      } catch {
        setDismissedTips([])
      }
    }

    // Fetch tips
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      const response = await fetch('/api/ai/smart-tips')
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

  const dismissTip = (tipId) => {
    const newDismissed = [...dismissedTips, tipId]
    setDismissedTips(newDismissed)
    localStorage.setItem('monity_dismissed_tips', JSON.stringify(newDismissed))
  }

  const visibleTips = tips.filter(tip => !dismissedTips.includes(tip.id))

  const getTypeStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: 'text-red-500',
        }
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          icon: 'text-amber-500',
        }
      default:
        return {
          bg: 'bg-[rgb(var(--accent))]/10',
          border: 'border-[rgb(var(--accent))]/30',
          icon: 'text-[rgb(var(--accent))]',
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
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded-lg animate-pulse" />
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded-lg animate-pulse" />
        </div>
      </Card>
    )
  }

  if (visibleTips.length === 0) {
    return null
  }

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('ai.smartTips')}
            </h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('insights.basedOnSpending')}
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

      {/* Tips List */}
      {isExpanded && (
        <div className="space-y-2">
          {visibleTips.map((tip) => {
            const styles = getTypeStyles(tip.type)
            
            return (
              <div
                key={tip.id}
                className={cn(
                  "relative p-3 rounded-xl border transition-all",
                  styles.bg,
                  styles.border,
                  "hover:shadow-sm"
                )}
              >
                <button
                  onClick={() => dismissTip(tip.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                </button>

                <div className="flex gap-3 pr-6">
                  <span className="text-xl flex-shrink-0">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-[rgb(var(--text-primary))] mb-0.5">
                      {tip.title}
                    </h4>
                    <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">
                      {tip.message}
                    </p>
                    
                    {tip.potentialSavings > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {t('insights.potentialSavings')}: {formatCurrency(tip.potentialSavings, { locale: localeString, symbol: currencySymbol })}
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
