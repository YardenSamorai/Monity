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
        <div className="aspect-[1.8/1] max-w-[280px] mx-auto rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
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
        <div className="aspect-[1.8/1] max-w-[280px] mx-auto rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center">
          <CreditCardIcon className="w-7 h-7 text-slate-400 dark:text-slate-500 mb-1.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
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
                "absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                isRTL ? "-right-1" : "-left-1"
              )}
            >
              {isRTL ? <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                isRTL ? "-left-1" : "-right-1"
              )}
            >
              {isRTL ? <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            </button>
          </>
        )}

        {/* Credit Card Visual - Soft gradient design */}
        <Link href={`/credit-cards/${currentCard.id}`}>
          <div 
            className="aspect-[1.8/1] max-w-[280px] mx-auto rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
            </div>

            {/* Top Row - Chip & Brand */}
            <div className="flex items-start justify-between relative z-10">
              {/* Chip */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-4 rounded-sm bg-amber-300/80" />
                <Wifi className="w-3 h-3 text-white/70 rotate-90" />
              </div>
              
              {/* Brand */}
              <span className="text-[10px] font-bold text-white/90 tracking-wider">
                {brandName}
              </span>
            </div>

            {/* Card Number - Last 4 digits on the RIGHT */}
            <div className="text-xs font-mono text-white/90 tracking-[0.15em] relative z-10 text-center" dir="ltr">
              •••• •••• •••• {currentCard.lastFourDigits}
            </div>

            {/* Bottom Row - Amount & Billing */}
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-[9px] text-white/60 mb-0.5 uppercase tracking-wide">
                  {t('creditCards.pendingCharges')}
                </p>
                <p className={cn(
                  "text-sm font-semibold text-white"
                )}>
                  {formatCurrency(currentCard.pendingAmount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[9px] text-white/60 mb-0.5 uppercase tracking-wide">
                  {t('creditCards.billingDay')}
                </p>
                <p className="text-xs text-white/90">
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
                  ? "bg-[rgb(var(--accent))]" 
                  : "bg-slate-300 dark:bg-slate-600"
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
