'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { Sparkles, Check, TrendingUp, Hash, Zap } from 'lucide-react'

export function CategorySuggestions({ 
  description, 
  amount, 
  type,
  onSelect,
  selectedCategoryId,
  className 
}) {
  const { t, currencySymbol } = useI18n()
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

    // Debounce the API call (500ms)
    debounceRef.current = setTimeout(async () => {
      // Only fetch if we have at least 3 characters in description or an amount
      if ((description?.length >= 3) || (amount && Number(amount) > 0)) {
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
    }, 500)

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-emerald-500'
    if (confidence >= 0.4) return 'text-amber-500'
    return 'text-slate-400'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.7) return t('ai.highConfidence')
    if (confidence >= 0.4) return t('ai.mediumConfidence')
    return t('ai.lowConfidence')
  }

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'similar_description':
        return <Check className="w-3 h-3" />
      case 'amount_range_match':
      case 'amount_in_range':
        return <TrendingUp className="w-3 h-3" />
      case 'frequently_used':
        return <Hash className="w-3 h-3" />
      default:
        return <Zap className="w-3 h-3" />
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
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.categoryId}
              type="button"
              onClick={() => onSelect(suggestion.categoryId)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                "bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]",
                "hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/10",
                "active:scale-95"
              )}
            >
              {/* Category icon & name */}
              <span className="text-base">{suggestion.categoryIcon || '📁'}</span>
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {suggestion.categoryName}
              </span>
              
              {/* Confidence indicator */}
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                suggestion.confidence >= 0.7 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : suggestion.confidence >= 0.4
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Best match details */}
      {!loading && suggestions.length > 0 && suggestions[0].avgAmount > 0 && (
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border-secondary))]">
          <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
            💡 {t('ai.avgAmountHint', { 
              category: suggestions[0].categoryName,
              amount: `${currencySymbol}${suggestions[0].avgAmount}`
            })}
          </p>
        </div>
      )}
    </div>
  )
}
