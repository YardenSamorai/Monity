'use client'

import { useState } from 'react'
import { Wallet, Building2, CreditCard, Banknote, ArrowRight, ArrowLeft, Lightbulb, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'

export function AddAccountStep({ onNext, onBack, currency, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('bank')
  const [errors, setErrors] = useState({ name: false, balance: false })
  
  const [formData, setFormData] = useState({
    name: '',
    balance: '0',
  })

  const accountTypes = [
    { id: 'bank', icon: Building2, label: t('onboarding.account.typeBank') },
    { id: 'cash', icon: Banknote, label: t('onboarding.account.typeCash') },
    { id: 'credit', icon: CreditCard, label: t('onboarding.account.typeCredit') },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setErrors({ name: false, balance: false })
    
    let hasError = false
    const newErrors = { name: false, balance: false }
    
    if (!formData.name.trim()) {
      newErrors.name = true
      hasError = true
    }

    const balanceValue = formData.balance.trim()
    if (balanceValue && isNaN(Number(balanceValue))) {
      newErrors.balance = true
      hasError = true
    }
    
    if (hasError) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: selectedType,
          balance: Number(formData.balance) || 0,
          currency: currency,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create account')
      }

      const data = await response.json()
      onNext(data.account)
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }))
    if (errors.name && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, name: false }))
    }
  }

  const handleBalanceChange = (e) => {
    setFormData(prev => ({ ...prev, balance: e.target.value }))
    if (errors.balance && e.target.value && !isNaN(Number(e.target.value))) {
      setErrors(prev => ({ ...prev, balance: false }))
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-6 h-6 text-[rgb(var(--accent))]" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {t('onboarding.account.title')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('onboarding.account.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Account Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
            {t('onboarding.account.typeLabel')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {accountTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  selectedType === type.id
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5"
                    : "border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] hover:border-[rgb(var(--border-secondary))]"
                )}
              >
                <type.icon className={cn(
                  "w-6 h-6",
                  selectedType === type.id 
                    ? "text-[rgb(var(--accent))]" 
                    : "text-[rgb(var(--text-tertiary))]"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  selectedType === type.id 
                    ? "text-[rgb(var(--accent))]" 
                    : "text-[rgb(var(--text-secondary))]"
                )}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('onboarding.account.nameLabel')}
            <span className="text-[rgb(var(--negative))] ms-1">*</span>
          </label>
          
          {errors.name && (
            <div className="flex items-center gap-2 mb-2 text-[rgb(var(--negative))]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('onboarding.account.errorName')}</span>
            </div>
          )}
          
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            placeholder={t('onboarding.account.namePlaceholder')}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:border-transparent transition-all",
              errors.name 
                ? "border-[rgb(var(--negative))] focus:ring-[rgb(var(--negative))]" 
                : "border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--accent))]"
            )}
            autoFocus
          />
        </div>

        {/* Balance */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('onboarding.account.balanceLabel')}
          </label>
          
          {errors.balance && (
            <div className="flex items-center gap-2 mb-2 text-[rgb(var(--negative))]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('onboarding.account.errorBalance')}</span>
            </div>
          )}
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={formData.balance}
              onChange={handleBalanceChange}
              placeholder="0"
              className={cn(
                "w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                errors.balance 
                  ? "border-[rgb(var(--negative))] focus:ring-[rgb(var(--negative))]" 
                  : "border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--accent))]"
              )}
              style={{ paddingInlineStart: '2.5rem' }}
              dir="ltr"
            />
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgb(var(--warning))]/5 border border-[rgb(var(--warning))]/20 mb-8">
          <Lightbulb className="w-5 h-5 text-[rgb(var(--warning))] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t('onboarding.account.tip')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-medium flex items-center justify-center gap-2 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            <ArrowLeft className={cn("w-4 h-4", isRTL && "rtl-flip")} />
            {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] py-3 px-4 rounded-xl bg-[rgb(var(--accent))] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t('common.continue')}
                <ArrowRight className={cn("w-4 h-4", isRTL && "rtl-flip")} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
