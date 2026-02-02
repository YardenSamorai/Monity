'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

const EMOJI_OPTIONS = ['🎯', '✈️', '🏠', '💻', '🚗', '🎓', '💍', '🏖️', '🛡️', '💰', '🎁', '📱']

export function CreateGoalModal({ isOpen, onClose, onCreate }) {
  const { toast } = useToast()
  const { t, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    icon: '🎯',
    targetAmount: '',
    targetDate: '',
    initialSavedAmount: '0',
    priority: 'medium',
    contributionMode: 'flexible',
    fixedMonthlyAmount: '',
    isRecurring: false,
    recurringPeriod: 'monthly',
  })

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t('goals.errors.nameRequired')
    }

    const targetAmount = parseFloat(formData.targetAmount)
    if (!targetAmount || targetAmount <= 0) {
      newErrors.targetAmount = t('goals.errors.targetAmountInvalid')
    }

    const initialSaved = parseFloat(formData.initialSavedAmount) || 0
    if (initialSaved < 0) {
      newErrors.initialSavedAmount = t('goals.errors.initialSavedInvalid')
    }

    if (targetAmount && initialSaved > targetAmount) {
      newErrors.initialSavedAmount = t('goals.errors.initialSavedExceeds')
    }

    if (formData.contributionMode === 'fixed') {
      const monthly = parseFloat(formData.fixedMonthlyAmount)
      if (!monthly || monthly <= 0) {
        newErrors.fixedMonthlyAmount = t('goals.errors.monthlyAmountRequired')
      }
    }

    if (formData.targetDate) {
      const targetDate = new Date(formData.targetDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (targetDate <= today) {
        newErrors.targetDate = t('goals.errors.targetDateInvalid')
      }
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
      await onCreate({
        name: formData.name.trim(),
        icon: formData.icon,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate || null,
        initialSavedAmount: parseFloat(formData.initialSavedAmount) || 0,
        priority: formData.priority,
        contributionMode: formData.contributionMode,
        fixedMonthlyAmount: formData.contributionMode === 'fixed' ? parseFloat(formData.fixedMonthlyAmount) : null,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : null,
      })

      toast.success(t('goals.created'), t('goals.createdSuccess'))
      
      // Reset form
      setFormData({
        name: '',
        icon: '🎯',
        targetAmount: '',
        targetDate: '',
        initialSavedAmount: '0',
        priority: 'medium',
        contributionMode: 'flexible',
        fixedMonthlyAmount: '',
      })
      setErrors({})
      onClose()
    } catch (error) {
      toast.error(t('goals.createFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('goals.createGoal')} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Name */}
        <Input
          label={t('goals.goalName')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('goals.goalNamePlaceholder')}
          error={errors.name}
          required
        />

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            {t('goals.icon')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  formData.icon === emoji
                    ? 'bg-light-accent dark:bg-dark-accent scale-110'
                    : 'bg-light-surface dark:bg-dark-surface hover:bg-light-border-light dark:hover:bg-dark-border-light'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Target Amount */}
        <Input
          label={t('goals.targetAmount')}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.targetAmount}
          onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          placeholder="0.00"
          error={errors.targetAmount}
          required
        />

        {/* Target Date */}
        <Input
          label={t('goals.targetDate')}
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          error={errors.targetDate}
          helperText={t('goals.targetDateHelper')}
        />

        {/* Initial Saved Amount */}
        <Input
          label={t('goals.initialSaved')}
          type="number"
          step="0.01"
          min="0"
          value={formData.initialSavedAmount}
          onChange={(e) => setFormData({ ...formData, initialSavedAmount: e.target.value })}
          placeholder="0.00"
          error={errors.initialSavedAmount}
          helperText={t('goals.initialSavedHelper')}
        />

        {/* Priority */}
        <Select
          label={t('goals.priority')}
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          <option value="low">{t('goals.priorityOptions.low')}</option>
          <option value="medium">{t('goals.priorityOptions.medium')}</option>
          <option value="high">{t('goals.priorityOptions.high')}</option>
        </Select>

        {/* Contribution Mode */}
        <Select
          label={t('goals.contributionMode')}
          value={formData.contributionMode}
          onChange={(e) => setFormData({ ...formData, contributionMode: e.target.value })}
        >
          <option value="flexible">{t('goals.contributionModeOptions.flexible')}</option>
          <option value="fixed">{t('goals.contributionModeOptions.fixed')}</option>
        </Select>

        {/* Fixed Monthly Amount (if fixed mode) */}
        {formData.contributionMode === 'fixed' && (
          <Input
            label={t('goals.fixedMonthlyAmount')}
            type="number"
            step="0.01"
            min="0.01"
            value={formData.fixedMonthlyAmount}
            onChange={(e) => setFormData({ ...formData, fixedMonthlyAmount: e.target.value })}
            placeholder="0.00"
            error={errors.fixedMonthlyAmount}
            helperText={t('goals.fixedMonthlyAmountHelper')}
            required
          />
        )}

        {/* Recurring Goal */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
            className="w-4 h-4 rounded border-light-border dark:border-dark-border"
          />
          <label htmlFor="isRecurring" className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {t('goals.recurringGoal')}
          </label>
        </div>

        {formData.isRecurring && (
          <Select
            label={t('goals.recurringPeriod')}
            value={formData.recurringPeriod}
            onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
          >
            <option value="monthly">{t('goals.recurringPeriodOptions.monthly')}</option>
            <option value="yearly">{t('goals.recurringPeriodOptions.yearly')}</option>
          </Select>
        )}

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
            {loading ? t('common.loading') : t('goals.createGoal')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

