'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CategoryModal } from '@/components/forms/CategoryModal'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { Plus } from 'lucide-react'

export function RecurringIncomeModal({ isOpen, onClose, accounts, categories: initialCategories, onSuccess, editingIncome = null }) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const isEditing = !!editingIncome
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    dayOfMonth: '1',
  })

  // Load editing income data when modal opens
  useEffect(() => {
    if (isOpen && editingIncome) {
      setFormData({
        amount: String(editingIncome.amount),
        description: editingIncome.description,
        accountId: editingIncome.accountId,
        categoryId: editingIncome.categoryId || '',
        dayOfMonth: String(editingIncome.dayOfMonth),
      })
    } else if (isOpen && !editingIncome) {
      // Reset form for new income
      setFormData({
        amount: '',
        description: t('settings.recurringIncomeDefaultDescription'),
        accountId: accounts[0]?.id || '',
        categoryId: '',
        dayOfMonth: '1',
      })
    }
  }, [isOpen, editingIncome, accounts, t])

  // Update categories when initialCategories changes
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const handleCategoryCreated = async (newCategory) => {
    // Add the new category to the list
    setCategories([...categories, newCategory])
    // Select the newly created category
    setFormData({ ...formData, categoryId: newCategory.id })
    setIsCategoryModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/recurring-income/${editingIncome.id}`
        : '/api/recurring-income'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dayOfMonth: parseInt(formData.dayOfMonth),
          categoryId: formData.categoryId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || (isEditing ? 'Failed to update recurring income' : 'Failed to create recurring income'))
      }

      if (isEditing) {
        toast.success(
          t('settings.recurringIncomeUpdated'),
          t('settings.recurringIncomeUpdatedDesc', { description: formData.description })
        )
      } else {
        toast.success(
          t('settings.recurringIncomeCreated'),
          t('settings.recurringIncomeCreatedDesc', { description: formData.description, day: formData.dayOfMonth })
        )
      }
      
      onSuccess?.()
      onClose()
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: '',
        dayOfMonth: '1',
      })
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} recurring income:`, error)
      toast.error(
        isEditing ? t('settings.recurringIncomeUpdateFailed') : t('settings.recurringIncomeCreateFailed'),
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const incomeCategories = categories.filter(
    cat => cat.type === 'income' || cat.type === 'both'
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('settings.editRecurringIncome') : t('settings.setRecurringIncome')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="5000.00"
          helperText={t('settings.monthlyIncome')}
          required
        />

        <Input
          label={t('transactions.description')}
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('settings.recurringIncomeDescriptionPlaceholder')}
          required
        />

        <Select
          label={t('settings.depositToAccount')}
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
              {t('transactions.category')}
            </label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-8 px-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('settings.addCategory')}
            </Button>
          </div>
          <Select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">{t('transactions.uncategorized')}</option>
            {incomeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label={t('settings.dayOfMonth')}
          value={formData.dayOfMonth}
          onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
          helperText={t('settings.dayOfMonthHelper')}
          required
        >
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {t('settings.dayOfMonthOption', { day })}
            </option>
          ))}
        </Select>

        <div className="bg-light-accent-light dark:bg-dark-accent-light rounded-xl p-4 text-sm">
          <p className="text-light-text-primary dark:text-dark-text-primary mb-2 font-medium">
            💡 {t('settings.howItWorks')}
          </p>
          <ul className="text-light-text-secondary dark:text-dark-text-secondary space-y-1 list-disc list-inside">
            <li>{t('settings.recurringInfo1')}</li>
            <li>{t('settings.recurringInfo2')}</li>
            <li>{t('settings.recurringInfo3')}</li>
          </ul>
        </div>

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
            {loading ? t('common.loading') : (isEditing ? t('settings.updateRecurringIncome') : t('settings.createRecurringIncome'))}
          </Button>
        </div>
      </form>

      {/* Category Modal - Pre-set type to income */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        defaultType="income"
      />
    </Modal>
  )
}

