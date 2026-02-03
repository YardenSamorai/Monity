'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon, Wifi } from 'lucide-react'

// Card brand logos and colors
const CARD_BRANDS = {
  visa: {
    name: 'VISA',
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
    textColor: 'text-white',
    logo: 'VISA',
  },
  mastercard: {
    name: 'Mastercard',
    gradient: 'from-orange-500 via-red-500 to-yellow-500',
    textColor: 'text-white',
    logo: '●●',
  },
  amex: {
    name: 'AMEX',
    gradient: 'from-blue-400 via-blue-500 to-blue-700',
    textColor: 'text-white',
    logo: 'AMEX',
  },
  diners: {
    name: 'Diners',
    gradient: 'from-slate-600 via-slate-500 to-slate-700',
    textColor: 'text-white',
    logo: 'DINERS',
  },
  discover: {
    name: 'Discover',
    gradient: 'from-orange-400 via-orange-500 to-orange-600',
    textColor: 'text-white',
    logo: 'DISCOVER',
  },
  isracard: {
    name: 'Isracard',
    gradient: 'from-blue-700 via-blue-600 to-blue-800',
    textColor: 'text-white',
    logo: 'ISRACARD',
  },
  cal: {
    name: 'CAL',
    gradient: 'from-red-600 via-red-500 to-red-700',
    textColor: 'text-white',
    logo: 'CAL',
  },
  max: {
    name: 'MAX',
    gradient: 'from-cyan-500 via-blue-500 to-blue-600',
    textColor: 'text-white',
    logo: 'MAX',
  },
  other: {
    name: 'Card',
    gradient: 'from-slate-500 via-slate-400 to-slate-600',
    textColor: 'text-white',
    logo: '●',
  },
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
      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('creditCards.title')}
            </h3>
          </div>
        </div>
        <div className="aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
        <div className="mt-4 text-center">
          <div className="h-4 w-24 bg-[rgb(var(--bg-tertiary))] rounded mx-auto" />
        </div>
      </Card>
    )
  }

  // Empty state - no cards
  if (cards.length === 0) {
    return (
      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('creditCards.title')}
            </h3>
          </div>
        </div>
        
        {/* Empty card skeleton */}
        <div className="aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center">
          <CreditCardIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {t('creditCards.emptyTitle')}
          </p>
          <Link href="/credit-cards">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t('creditCards.addCard')}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  const currentCard = cards[currentIndex]
  const brand = CARD_BRANDS[currentCard?.name] || CARD_BRANDS.other

  return (
    <Card className="p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <h3 className="font-semibold text-[rgb(var(--text-primary))]">
            {t('creditCards.title')}
          </h3>
        </div>
        <Link 
          href="/credit-cards"
          className="text-xs text-[rgb(var(--accent))] hover:underline font-medium"
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
                "absolute top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors",
                isRTL ? "right-2" : "left-2"
              )}
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors",
                isRTL ? "left-2" : "right-2"
              )}
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </>
        )}

        {/* Credit Card Visual */}
        <Link href={`/credit-cards/${currentCard.id}`}>
          <div 
            className={cn(
              "aspect-[1.6/1] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg",
              `bg-gradient-to-br ${brand.gradient}`
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white" />
            </div>

            {/* Top Row - Chip & Logo */}
            <div className="flex items-start justify-between relative z-10">
              {/* Chip */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner" />
                <Wifi className="w-5 h-5 text-white/80 rotate-90" />
              </div>
              
              {/* Brand Logo */}
              <div className={cn("font-bold text-xl tracking-wider", brand.textColor)}>
                {brand.logo}
              </div>
            </div>

            {/* Card Number */}
            <div className={cn("text-lg font-mono tracking-[0.2em] relative z-10", brand.textColor)}>
              •••• •••• •••• {currentCard.lastFourDigits}
            </div>

            {/* Bottom Row - Amount & Billing */}
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-xs text-white/60 mb-0.5">{t('creditCards.pendingCharges')}</p>
                <p className={cn("text-xl font-bold", brand.textColor)}>
                  {formatCurrency(currentCard.pendingAmount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs text-white/60 mb-0.5">{t('creditCards.billingIn', { days: currentCard.daysUntilBilling })}</p>
                <p className={cn("text-sm font-medium", brand.textColor)}>
                  {t('creditCards.dayOfMonth', { day: currentCard.billingDay })}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Dots Indicator */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex 
                  ? "bg-[rgb(var(--accent))]" 
                  : "bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--text-tertiary))]"
              )}
            />
          ))}
        </div>
      )}

      {/* Limit Warning if applicable */}
      {currentCard.creditLimit && Number(currentCard.pendingAmount) / Number(currentCard.creditLimit) >= 0.8 && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
            ⚠️ {t('creditCards.nearingLimit')} ({Math.round((Number(currentCard.pendingAmount) / Number(currentCard.creditLimit)) * 100)}%)
          </p>
        </div>
      )}
    </Card>
  )
}
