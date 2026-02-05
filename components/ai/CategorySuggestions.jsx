'use client'

import { useState, useEffect, useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { Sparkles, Check, TrendingUp, Hash, Zap, Clock, Repeat, Target } from 'lucide-react'

export function CategorySuggestions({ 
  description, 
  amount, 
  type,
  onSelect,
  selectedCategoryId,
  className 
}) {
  const { t, currencySymbol, localeString } = useI18n()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const debounceRef = useRef(null)

  // Fetch suggestions with debounce
  useEffect(() => {
    // Reset dismissed state when input changes significantly
    setDismissed(false)
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Don't fetch if no description or amount
    if (!description && !amount) {
      setSuggestions([])
      return
    }

    // Debounce the API call (400ms - slightly faster for better UX)
    debounceRef.current = setTimeout(async () => {
      // Only fetch if we have at least 2 characters in description or an amount > 0
      if ((description?.length >= 2) || (amount && Number(amount) > 0)) {
        setLoading(true)
        try {
          const response = await fetch('/api/ai/suggest-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: description || '',
              amount: Number(amount) || 0,
              type: type || 'expense',
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            setSuggestions(data.suggestions || [])
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error)
        } finally {
          setLoading(false)
        }
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [description, amount, type])

  // Don't show if dismissed or no suggestions
  if (dismissed || (suggestions.length === 0 && !loading)) {
    return null
  }

  // Don't show if already selected one of the suggestions
  if (selectedCategoryId && suggestions.some(s => s.categoryId === selectedCategoryId)) {
    return null
  }

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.7) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        label: t('ai.highConfidence'),
      }
    }
    if (confidence >= 0.4) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        label: t('ai.mediumConfidence'),
      }
    }
    return {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-500',
      label: t('ai.lowConfidence'),
    }
  }

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'exact_match':
        return <Check className="w-3 h-3 text-emerald-500" />
      case 'similar_description':
      case 'partial_match':
        return <Target className="w-3 h-3 text-blue-500" />
      case 'exact_amount':
      case 'similar_amount':
        return <TrendingUp className="w-3 h-3 text-violet-500" />
      case 'recurring_pattern':
        return <Repeat className="w-3 h-3 text-orange-500" />
      case 'category_name_match':
        return <Hash className="w-3 h-3 text-cyan-500" />
      default:
        return <Zap className="w-3 h-3 text-slate-400" />
    }
  }

  const getReasonText = (reason, suggestion) => {
    switch (reason) {
      case 'exact_match':
        return t('ai.reasonExactMatch')
      case 'similar_description':
        return t('ai.reasonSimilarDesc')
      case 'partial_match':
        return t('ai.reasonPartialMatch')
      case 'exact_amount':
        return t('ai.reasonExactAmount')
      case 'similar_amount':
        return t('ai.reasonSimilarAmount')
      case 'recurring_pattern':
        return t('ai.reasonRecurring')
      case 'category_name_match':
        return t('ai.reasonCategoryName')
      default:
        return ''
    }
  }

  return (
    <div className={cn(
      "rounded-xl border border-[rgb(var(--accent))]/20 bg-[rgb(var(--accent))]/5 p-3",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[rgb(var(--accent))]" />
          <span className="text-xs font-medium text-[rgb(var(--accent))]">
            {t('ai.suggestedCategories')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
        >
          {t('common.dismiss')}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-[rgb(var(--accent))]/30 border-t-[rgb(var(--accent))] rounded-full animate-spin" />
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('ai.analyzing')}
          </span>
        </div>
      )}

      {/* Suggestions */}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => {
            const badge = getConfidenceBadge(suggestion.confidence)
            const isTopMatch = index === 0 && suggestion.confidence >= 0.5
            
            return (
              <button
                key={suggestion.categoryId}
                type="button"
                onClick={() => onSelect(suggestion.categoryId)}
                className={cn(
                  "w-full flex flex-col gap-1.5 p-3 rounded-lg transition-all text-start",
                  "bg-[rgb(var(--bg-secondary))] border",
                  isTopMatch 
                    ? "border-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent))]/20" 
                    : "border-[rgb(var(--border-primary))]",
                  "hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/10",
                  "active:scale-[0.99]"
                )}
              >
                {/* Top row: icon, name, confidence */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{suggestion.categoryIcon || '📁'}</span>
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {suggestion.categoryName}
                    </span>
                    {isTopMatch && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--accent))]/20 text-[rgb(var(--accent))] font-medium">
                        {t('ai.bestMatch')}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    badge.bg,
                    badge.text
                  )}>
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>

                {/* Reason tags */}
                {suggestion.reasons && suggestion.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestion.reasons.slice(0, 3).map((reason, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))]"
                      >
                        {getReasonIcon(reason)}
                        {getReasonText(reason, suggestion)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Matched transaction info */}
                {suggestion.matchedDescription && (
                  <p className="text-[10px] text-[rgb(var(--text-tertiary))] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('ai.matchedWith')}: "{suggestion.matchedDescription}"
                    {suggestion.matchedAmount && (
                      <span className="font-medium">
                        ({formatCurrency(suggestion.matchedAmount, { locale: localeString, symbol: currencySymbol })})
                      </span>
                    )}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Usage hint */}
      {!loading && suggestions.length > 0 && suggestions[0].usageCount > 5 && (
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border-secondary))]">
          <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
            💡 {t('ai.usageHint', { 
              count: suggestions[0].usageCount,
              category: suggestions[0].categoryName,
            })}
          </p>
        </div>
      )}
    </div>
  )
}
