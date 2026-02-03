'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  CreditCard as CreditCardIcon,
  ChevronRight,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react'

// Card type names mapping
const CARD_TYPE_NAMES = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  isracard: 'Isracard',
  cal: 'Cal - כאל',
  max: 'Max - לאומי קארד',
  other: 'Other',
}

export function CreditCardsWidget() {
  const { t, currencySymbol, localeString } = useI18n()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/credit-cards')
      .then(res => res.json())
      .then(data => setCards(data.creditCards || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-5 w-32 bg-[rgb(var(--bg-tertiary))] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded-xl" />
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded-xl" />
        </div>
      </Card>
    )
  }

  if (cards.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('creditCards.title')}
            </h3>
          </div>
        </div>
        <Link 
          href="/credit-cards"
          className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--text-tertiary))] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t('creditCards.addFirstCard')}</span>
        </Link>
      </Card>
    )
  }

  const totalPending = cards.reduce((sum, card) => sum + Number(card.pendingAmount), 0)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <h3 className="font-semibold text-[rgb(var(--text-primary))]">
            {t('creditCards.title')}
          </h3>
        </div>
        <Link 
          href="/credit-cards"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('common.viewAll')}
        </Link>
      </div>

      {/* Total Pending */}
      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-sm text-rose-700 dark:text-rose-300">
              {t('creditCards.totalPending')}
            </span>
          </div>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(totalPending, { locale: localeString, symbol: currencySymbol })}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-2">
        {cards.slice(0, 3).map((card) => {
          const limitUsedPercent = card.creditLimit
            ? Math.round((Number(card.pendingAmount) / Number(card.creditLimit)) * 100)
            : null
          const isNearLimit = limitUsedPercent !== null && limitUsedPercent >= 80

          return (
            <Link
              key={card.id}
              href={`/credit-cards/${card.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <CreditCardIcon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                    {CARD_TYPE_NAMES[card.name] || card.name}
                  </p>
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    •••• {card.lastFourDigits}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('creditCards.billingIn', { days: card.daysUntilBilling })}
                  </span>
                  {isNearLimit && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      {limitUsedPercent}%
                    </span>
                  )}
                </div>
              </div>

              <div className="text-end">
                <p className="font-semibold text-sm text-rose-600 dark:text-rose-400">
                  {formatCurrency(card.pendingAmount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] flex-shrink-0" />
            </Link>
          )
        })}
      </div>

      {cards.length > 3 && (
        <Link
          href="/credit-cards"
          className="block text-center text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] mt-3 pt-3 border-t border-[rgb(var(--border-primary))]"
        >
          {t('creditCards.viewMore', { count: cards.length - 3 })}
        </Link>
      )}
    </Card>
  )
}
