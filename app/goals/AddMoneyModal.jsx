'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { Building2, Banknote, CreditCard } from 'lucide-react'

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

export function AddMoneyModal({ isOpen, onClose, goal, onAdd, accounts = [], creditCards = [] }) {
  const { toast } = useToast()
  const { t, currencySymbol, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'account', // 'account', 'cash', 'creditCard'
    accountId: accounts[0]?.id || '',
    creditCardId: creditCards[0]?.id || '',
  })

  // Update default account/credit card when accounts/creditCards change
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }))
    }
    if (creditCards.length > 0 && !formData.creditCardId) {
      setFormData(prev => ({ ...prev, creditCardId: creditCards[0].id }))
    }
  }, [accounts, creditCards])

  const validate = () => {
    const newErrors = {}

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      newErrors.amount = t('goals.errors.amountInvalid')
    }

    const newTotal = goal.savedAmount + amount
    if (newTotal > goal.targetAmount) {
      newErrors.amount = t('goals.errors.amountExceedsTarget')
    }

    if (formData.paymentMethod !== 'cash' && formData.paymentMethod !== 'creditCard' && !formData.accountId) {
      newErrors.accountId = t('goals.errors.selectAccount')
    }

    if (formData.paymentMethod === 'creditCard' && !formData.creditCardId) {
      newErrors.creditCardId = t('goals.errors.selectCreditCard')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      await onAdd(
        goal.id, 
        parseFloat(formData.amount), 
        formData.date, 
        formData.note,
        formData.paymentMethod,
        formData.paymentMethod === 'creditCard' ? formData.creditCardId : formData.accountId
      )

      toast.success(t('goals.moneyAdded'), t('goals.moneyAddedSuccess'))
      
      // Reset form
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'account',
        accountId: accounts[0]?.id || '',
        creditCardId: creditCards[0]?.id || '',
      })
      setErrors({})
      onClose()
    } catch (error) {
      toast.error(t('goals.addMoneyFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  const remaining = goal.targetAmount - goal.savedAmount

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('goals.addMoney')} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Info */}
        <div className="p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{goal.icon}</span>
            <div>
              <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {goal.name}
              </div>
              <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary" dir="ltr">
                {t('goals.remaining')}: {formatCurrency(remaining, { locale: localeString, symbol: currencySymbol })}
              </div>
            </div>
          </div>
        </div>

        {/* Amount */}
        <Input
          label={t('goals.amount')}
          type="number"
          step="0.01"
          min="0.01"
          max={remaining}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          error={errors.amount}
          required
        />

        {/* Date */}
        <Input
          label={t('goals.date')}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
        />

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
              const isSelected = formData.paymentMethod === method.id
              const isDisabled = method.id === 'creditCard' && creditCards.length === 0
              
              return (
                <button
                  key={method.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
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
        {formData.paymentMethod === 'creditCard' && creditCards.length > 0 && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {t('creditCards.selectCard')}
            </label>
            <select
              value={formData.creditCardId || ''}
              onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] text-base appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%239ca3af%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {CARD_TYPE_NAMES[card.name] || card.name} •••• {card.lastFourDigits}
                </option>
              ))}
            </select>
            {errors.creditCardId && (
              <p className="text-xs text-red-500 mt-1">{errors.creditCardId}</p>
            )}
          </div>
        )}

        {/* Account Selector (if account payment method) */}
        {formData.paymentMethod === 'account' && accounts.length > 1 && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {t('goals.selectAccount')}
            </label>
            <select
              value={formData.accountId || ''}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] text-base appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%239ca3af%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-xs text-red-500 mt-1">{errors.accountId}</p>
            )}
          </div>
        )}

        {/* Note */}
        <Input
          label={t('goals.note')}
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder={t('goals.notePlaceholder')}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('goals.addMoney')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

