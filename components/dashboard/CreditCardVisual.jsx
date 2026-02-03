'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon, Wifi } from 'lucide-react'

// Card brand names
const CARD_BRANDS = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  diners: 'DINERS',
  discover: 'DISCOVER',
  isracard: 'ISRACARD',
  cal: 'CAL',
  max: 'MAX',
  other: '●',
}

export function CreditCardVisual() {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch('/api/credit-cards')
      .then(res => res.json())
      .then(data => setCards(data.creditCards || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : cards.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev < cards.length - 1 ? prev + 1 : 0))
  }

  // Loading skeleton
  if (loading) {
    return (
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('creditCards.title')}
            </h3>
          </div>
        </div>
        <div className="aspect-[1.7/1] rounded-xl bg-[rgb(var(--bg-tertiary))] animate-pulse" />
      </Card>
    )
  }

  // Empty state - no cards
  if (cards.length === 0) {
    return (
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('creditCards.title')}
            </h3>
          </div>
        </div>
        
        {/* Empty card skeleton */}
        <div className="aspect-[1.7/1] rounded-xl border-2 border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))] flex flex-col items-center justify-center">
          <CreditCardIcon className="w-8 h-8 text-[rgb(var(--text-tertiary))] mb-2" />
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-2">
            {t('creditCards.emptyTitle')}
          </p>
          <Link href="/credit-cards">
            <Button size="sm" variant="secondary" className="gap-1 text-xs h-7">
              <Plus className="w-3 h-3" />
              {t('creditCards.addCard')}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  const currentCard = cards[currentIndex]
  const brandName = CARD_BRANDS[currentCard?.name] || CARD_BRANDS.other
  const limitPercent = currentCard.creditLimit 
    ? Math.round((Number(currentCard.pendingAmount) / Number(currentCard.creditLimit)) * 100)
    : null
  const isNearLimit = limitPercent !== null && limitPercent >= 80

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {t('creditCards.title')}
          </h3>
        </div>
        <Link 
          href="/credit-cards"
          className="text-xs text-[rgb(var(--accent))] hover:underline"
        >
          {t('common.viewAll')}
        </Link>
      </div>

      {/* Card Navigation */}
      <div className="relative">
        {/* Navigation Arrows */}
        {cards.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-[rgb(var(--bg-secondary))]/90 border border-[rgb(var(--border-primary))] shadow-sm hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                isRTL ? "right-1" : "left-1"
              )}
            >
              {isRTL ? <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--text-secondary))]" /> : <ChevronLeft className="w-3.5 h-3.5 text-[rgb(var(--text-secondary))]" />}
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-[rgb(var(--bg-secondary))]/90 border border-[rgb(var(--border-primary))] shadow-sm hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                isRTL ? "left-1" : "right-1"
              )}
            >
              {isRTL ? <ChevronLeft className="w-3.5 h-3.5 text-[rgb(var(--text-secondary))]" /> : <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--text-secondary))]" />}
            </button>
          </>
        )}

        {/* Credit Card Visual - Calm Design */}
        <Link href={`/credit-cards/${currentCard.id}`}>
          <div 
            className="aspect-[1.7/1] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]"
          >
            {/* Top Row - Chip & Brand */}
            <div className="flex items-start justify-between">
              {/* Chip */}
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-5 rounded bg-[rgb(var(--text-tertiary))]/20 border border-[rgb(var(--border-primary))]" />
                <Wifi className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] rotate-90" />
              </div>
              
              {/* Brand */}
              <span className="text-xs font-bold text-[rgb(var(--text-tertiary))] tracking-wider">
                {brandName}
              </span>
            </div>

            {/* Card Number */}
            <div className="text-sm font-mono text-[rgb(var(--text-secondary))] tracking-widest">
              •••• •••• •••• {currentCard.lastFourDigits}
            </div>

            {/* Bottom Row - Amount & Billing */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-0.5 uppercase tracking-wide">
                  {t('creditCards.pendingCharges')}
                </p>
                <p className={cn(
                  "text-base font-semibold",
                  isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-[rgb(var(--text-primary))]"
                )}>
                  {formatCurrency(currentCard.pendingAmount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-0.5 uppercase tracking-wide">
                  {t('creditCards.billingDay')}
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  {currentCard.daysUntilBilling} {t('common.days')}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Dots Indicator */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                index === currentIndex 
                  ? "bg-[rgb(var(--text-secondary))]" 
                  : "bg-[rgb(var(--border-primary))]"
              )}
            />
          ))}
        </div>
      )}

      {/* Limit Warning - subtle */}
      {isNearLimit && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center mt-2">
          ⚠️ {limitPercent}% {t('creditCards.ofLimit')}
        </p>
      )}
    </Card>
  )
}
