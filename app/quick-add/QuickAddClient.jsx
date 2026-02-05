'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Check, ChevronDown, Search, Plus, Building2, Banknote, CreditCard, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'

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

export default function QuickAddClient({
  accounts,
  categories,
  creditCards = [],
  household = null,
  recentAmounts,
  recentMerchants,
  defaultAccountId,
  currency,
}) {
  const router = useRouter()
  const { t, isRTL, currencySymbol } = useI18n()
  const { toast } = useToast()
  const amountInputRef = useRef(null)
  const formRef = useRef(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('account') // 'account', 'cash', 'creditCard'
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '')
  const [isShared, setIsShared] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [merchantSuggestions, setMerchantSuggestions] = useState([])
  const [savedAmount, setSavedAmount] = useState('')

  // Common amount chips
  const amountChips = useMemo(() => {
    const defaults = [20, 50, 100, 200]
    const combined = [...new Set([...recentAmounts, ...defaults])]
    return combined.slice(0, 6).sort((a, b) => a - b)
  }, [recentAmounts])

  // Focus amount input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 300) // Delay for smooth animation
    return () => clearTimeout(timer)
  }, [])

  // Prevent pull-to-refresh in PWA
  useEffect(() => {
    const preventPullToRefresh = (e) => {
      if (e.touches.length > 1) return
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      if (scrollTop === 0) {
        // Only prevent at top
        const touchY = e.touches[0].clientY
        if (touchY > 50) return // Allow normal touch
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventPullToRefresh, { passive: false })
    return () => document.removeEventListener('touchmove', preventPullToRefresh)
  }, [])

  // Fuzzy search for merchants
  useEffect(() => {
    if (!merchant.trim()) {
      setMerchantSuggestions([])
      return
    }

    const query = merchant.toLowerCase()
    const matches = recentMerchants.filter(m => {
      const name = m.name.toLowerCase()
      return name.includes(query) || name.startsWith(query)
    })
    setMerchantSuggestions(matches.slice(0, 5))
  }, [merchant, recentMerchants])

  // Auto-suggest category when merchant is selected
  const handleMerchantSelect = useCallback((selectedMerchant) => {
    setMerchant(selectedMerchant.name)
    if (selectedMerchant.categoryId) {
      setCategoryId(selectedMerchant.categoryId)
    }
    setMerchantSuggestions([])
  }, [])

  // Handle amount chip click with haptic-like feedback
  const handleAmountChip = useCallback((value) => {
    setAmount(value.toString())
    // Vibration API for haptic feedback (if available)
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  // Get selected category
  const selectedCategory = useMemo(() => 
    categories.find(c => c.id === categoryId),
    [categories, categoryId]
  )

  // Handle save with optimistic UI
  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t('quickAdd.enterAmount'))
      amountInputRef.current?.focus()
      // Vibrate for error
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50])
      }
      return
    }

    if (paymentMethod !== 'creditCard' && !accountId) {
      toast.error(t('quickAdd.selectAccount'))
      return
    }

    if (paymentMethod === 'creditCard' && !creditCardId) {
      toast.error(t('quickAdd.selectCreditCard'))
      return
    }

    setIsLoading(true)
    setSavedAmount(amount)
    
    try {
      let response

      if (paymentMethod === 'creditCard') {
        // Credit card transaction
        response = await fetch(`/api/credit-cards/${creditCardId}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(amount),
            description: merchant || t('quickAdd.expense'),
            categoryId: categoryId || null,
            date: new Date().toISOString(),
            isShared: isShared && household ? true : false,
            householdId: isShared && household ? household.id : null,
          }),
        })
      } else {
        // Regular bank/cash transaction
        response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            amount: Number(amount),
            description: merchant || t('quickAdd.expense'),
            categoryId: categoryId || null,
            accountId,
            date: new Date().toISOString(),
            isShared: isShared && household ? true : false,
            householdId: isShared && household ? household.id : null,
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      // Success vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }

      setShowSuccess(true)
      
      // Reset after delay
      setTimeout(() => {
        setShowSuccess(false)
        setAmount('')
        setMerchant('')
        setCategoryId('')
        setIsShared(false)
        setSavedAmount('')
        amountInputRef.current?.focus()
      }, 1500)

    } catch (error) {
      console.error('Error saving:', error)
      toast.error(t('common.error'))
      // Error vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle close/back
  const handleClose = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  // Success overlay
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-4 safe-area-inset">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-[rgb(var(--positive))] flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            {t('quickAdd.saved')}
          </h2>
          <p className="text-xl text-[rgb(var(--text-secondary))] tabular-nums animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            {currencySymbol}{Number(savedAmount).toLocaleString()}
          </p>
          <button
            onClick={() => {
              setShowSuccess(false)
              setAmount('')
              setMerchant('')
              setCategoryId('')
              setSavedAmount('')
              amountInputRef.current?.focus()
            }}
            className="mt-8 px-6 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] font-medium border border-[rgb(var(--border-primary))] animate-in fade-in duration-300 delay-300"
          >
            {t('quickAdd.addAnother')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={formRef}
      className="min-h-screen bg-[rgb(var(--bg-primary))] flex flex-col overscroll-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Header - with safe area */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] sticky top-0 z-10 safe-area-top pwa-header">
        <button
          onClick={handleClose}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[rgb(var(--bg-tertiary))] active:bg-[rgb(var(--bg-tertiary))] transition-colors touch-target"
        >
          <X className="w-6 h-6 text-[rgb(var(--text-secondary))]" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/MonityLogo.svg" alt="Monity" width={28} height={28} />
          <span className="font-semibold text-[rgb(var(--text-primary))]">
            {t('quickAdd.title')}
          </span>
        </div>
        <div className="w-11" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Amount Input - Hero section */}
        <div className="text-center py-6">
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3 block uppercase tracking-wide">
            {t('quickAdd.amount')}
          </label>
          <div className="flex items-center justify-center gap-2" dir="ltr">
            <span className="text-4xl font-light text-[rgb(var(--text-tertiary))]">
              {currencySymbol}
            </span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={amount}
              onChange={(e) => {
                // Only allow numbers and decimal
                const val = e.target.value.replace(/[^0-9.]/g, '')
                setAmount(val)
              }}
              placeholder="0"
              className="text-5xl font-bold text-[rgb(var(--text-primary))] bg-transparent border-none outline-none text-center w-48 tabular-nums caret-[rgb(var(--accent))]"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Amount Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {amountChips.map((value) => (
            <button
              key={value}
              onClick={() => handleAmountChip(value)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 touch-target",
                amount === value.toString()
                  ? "bg-[rgb(var(--accent))] text-white shadow-md"
                  : "bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--accent))] active:bg-[rgb(var(--bg-tertiary))]"
              )}
            >
              {currencySymbol}{value}
            </button>
          ))}
        </div>

        {/* Merchant Input */}
        <div className="relative">
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('quickAdd.merchant')}
          </label>
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t('quickAdd.merchantPlaceholder')}
              className="w-full ps-12 pe-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent text-base"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
            />
          </div>

          {/* Merchant Suggestions */}
          {merchantSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-lg overflow-hidden">
              {merchantSuggestions.map((m, index) => (
                <button
                  key={index}
                  onClick={() => handleMerchantSelect(m)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[rgb(var(--bg-tertiary))] active:bg-[rgb(var(--bg-tertiary))] transition-colors text-start touch-target"
                >
                  <span className="text-[rgb(var(--text-primary))]">{m.name}</span>
                  {m.category && (
                    <span className="text-xs text-[rgb(var(--text-tertiary))] flex items-center gap-1">
                      <span>{m.category.icon}</span>
                      {m.category.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('transactions.paymentMethod')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'account', icon: Building2, label: t('transactions.paymentMethods.account') },
              { id: 'cash', icon: Banknote, label: t('transactions.paymentMethods.cash') },
              { id: 'creditCard', icon: CreditCard, label: t('transactions.paymentMethods.creditCard') },
            ].map(method => {
              const Icon = method.icon
              const isSelected = paymentMethod === method.id
              const isDisabled = method.id === 'creditCard' && creditCards.length === 0
              
              return (
                <button
                  key={method.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 touch-target",
                    isSelected
                      ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10"
                      : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))] active:bg-[rgb(var(--bg-tertiary))]",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isSelected ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text-tertiary))]"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text-secondary))]"
                  )}>
                    {method.label}
                  </span>
                </button>
              )
            })}
          </div>
          {creditCards.length === 0 && (
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1.5">
              {t('transactions.noCreditCards')}
            </p>
          )}
        </div>

        {/* Credit Card Selector (if credit card payment method) */}
        {paymentMethod === 'creditCard' && creditCards.length > 0 && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {t('creditCards.selectCard')}
            </label>
            <select
              value={creditCardId || ''}
              onChange={(e) => setCreditCardId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] text-base appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%239ca3af%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {CARD_TYPE_NAMES[card.name] || card.name} •••• {card.lastFourDigits}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Account Selector (if account or cash payment method) */}
        {paymentMethod !== 'creditCard' && accounts.length > 1 && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {t('quickAdd.account')}
            </label>
            <select
              value={accountId || ''}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] text-base appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%239ca3af%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Selector */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('quickAdd.category')}
          </label>
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="w-full px-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] flex items-center justify-between active:bg-[rgb(var(--bg-tertiary))] transition-colors touch-target"
          >
            {selectedCategory ? (
              <span className="flex items-center gap-2.5 text-[rgb(var(--text-primary))]">
                <span className="text-xl">{selectedCategory.icon}</span>
                {selectedCategory.name}
              </span>
            ) : (
              <span className="text-[rgb(var(--text-tertiary))]">
                {t('quickAdd.selectCategory')}
              </span>
            )}
            <ChevronDown className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Shared Toggle (if user has household) */}
        {household && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {t('transactions.shared')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isShared}
              onClick={() => setIsShared(!isShared)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 flex-shrink-0',
                isShared
                  ? 'bg-[rgb(var(--accent))]'
                  : 'bg-[rgb(var(--text-tertiary))]/30'
              )}
              dir="ltr"
            >
              <span
                className={cn(
                  'absolute h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200',
                  isShared ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* Save Button - Fixed at bottom with safe area */}
      <div className="p-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] safe-area-bottom pwa-bottom-nav">
        <button
          onClick={handleSave}
          disabled={isLoading || !amount}
          className="w-full py-4 rounded-xl bg-[rgb(var(--accent))] text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-[rgb(var(--accent))]/20 touch-target"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-6 h-6" />
              {t('quickAdd.save')}
            </>
          )}
        </button>
      </div>

      {/* Category Picker Modal - Bottom sheet style */}
      {showCategoryPicker && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCategoryPicker(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[rgb(var(--bg-primary))] rounded-t-3xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-[rgb(var(--border-primary))]" />
            </div>
            
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[rgb(var(--border-primary))]">
              <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))]">
                {t('quickAdd.selectCategory')}
              </h3>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgb(var(--bg-tertiary))] active:bg-[rgb(var(--bg-tertiary))] touch-target"
              >
                <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id)
                      setShowCategoryPicker(false)
                      // Haptic feedback
                      if ('vibrate' in navigator) {
                        navigator.vibrate(10)
                      }
                    }}
                    className={cn(
                      "p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all active:scale-95 touch-target",
                      categoryId === cat.id
                        ? "bg-[rgb(var(--accent))]/10 border-2 border-[rgb(var(--accent))]"
                        : "bg-[rgb(var(--bg-secondary))] border-2 border-transparent hover:border-[rgb(var(--border-secondary))] active:bg-[rgb(var(--bg-tertiary))]"
                    )}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className={cn(
                      "text-xs font-medium text-center line-clamp-1",
                      categoryId === cat.id
                        ? "text-[rgb(var(--accent))]"
                        : "text-[rgb(var(--text-secondary))]"
                    )}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-[rgb(var(--border-primary))]">
              <button
                onClick={() => {
                  setCategoryId('')
                  setShowCategoryPicker(false)
                }}
                className="w-full py-3.5 rounded-xl text-[rgb(var(--text-secondary))] font-medium hover:bg-[rgb(var(--bg-tertiary))] active:bg-[rgb(var(--bg-tertiary))] transition-colors touch-target"
              >
                {t('quickAdd.noCategory')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
