'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency } from '@/lib/utils'

export function AddMoneyModal({ isOpen, onClose, goal, onAdd }) {
  const { toast } = useToast()
  const { t, currencySymbol, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

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
      await onAdd(goal.id, parseFloat(formData.amount), formData.date, formData.note)

      toast.success(t('goals.moneyAdded'), t('goals.moneyAddedSuccess'))
      
      // Reset form
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
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

