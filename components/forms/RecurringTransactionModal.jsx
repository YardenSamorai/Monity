'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CategoryModal } from '@/components/forms/CategoryModal'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { Plus } from 'lucide-react'

export function RecurringTransactionModal({ 
  isOpen, 
  onClose, 
  accounts, 
  categories: initialCategories, 
  onSuccess, 
  editingTransaction = null,
  defaultType = 'expense' 
}) {
  const { toast } = useToast()
  const { t, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const isEditing = !!editingTransaction
  
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: '',
    description: '',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    dayOfMonth: '1',
    endDate: '',
  })

  // Load editing transaction data when modal opens
  useEffect(() => {
    if (isOpen && editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: String(editingTransaction.amount),
        description: editingTransaction.description,
        accountId: editingTransaction.accountId,
        categoryId: editingTransaction.categoryId || '',
        dayOfMonth: String(editingTransaction.dayOfMonth),
        endDate: editingTransaction.endDate 
          ? new Date(editingTransaction.endDate).toISOString().slice(0, 10)
          : '',
      })
    } else if (isOpen && !editingTransaction) {
      // Reset form for new transaction
      // If defaultType is 'expense', lock it to expense
      setFormData({
        type: defaultType || 'expense',
        amount: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: '',
        dayOfMonth: '1',
        endDate: '',
      })
    }
  }, [isOpen, editingTransaction, accounts, defaultType])

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
        ? `/api/recurring-transactions/${editingTransaction.id}`
        : '/api/recurring-transactions'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dayOfMonth: parseInt(formData.dayOfMonth),
          categoryId: formData.categoryId || null,
          endDate: formData.endDate || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || (isEditing ? 'Failed to update recurring transaction' : 'Failed to create recurring transaction'))
      }

      if (isEditing) {
        toast.success(
          t('settings.recurringTransactionUpdated'),
          t('settings.recurringTransactionUpdatedDesc', { description: formData.description })
        )
      } else {
        toast.success(
          t('settings.recurringTransactionCreated'),
          t('settings.recurringTransactionCreatedDesc', { 
            description: formData.description, 
            day: formData.dayOfMonth,
            type: formData.type === 'income' ? t('transactions.income') : t('transactions.expense')
          })
        )
      }
      
      onSuccess?.()
      onClose()
      
      // Reset form
      setFormData({
        type: defaultType,
        amount: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: '',
        dayOfMonth: '1',
        endDate: '',
      })
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} recurring transaction:`, error)
      toast.error(
        isEditing ? t('settings.recurringTransactionUpdateFailed') : t('settings.recurringTransactionCreateFailed'),
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(
    cat => cat.type === formData.type || cat.type === 'both'
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        isEditing 
          ? t('settings.editRecurringTransaction')
          : (defaultType === 'expense' 
              ? t('settings.setRecurringExpense')
              : t('settings.setRecurringTransaction'))
      } 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Only show type selector if we're editing or defaultType is not 'expense' */}
        {/* When defaultType is 'expense' and not editing, hide the selector and lock it to expense */}
        {(!editingTransaction && defaultType === 'expense') ? null : (
          <Select
            label={t('transactions.type')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
            required
          >
            <option value="expense">{t('transactions.expense')}</option>
            <option value="income">{t('transactions.income')}</option>
          </Select>
        )}

        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          helperText={formData.type === 'income' ? t('settings.monthlyIncome') : t('settings.monthlyExpense')}
          required
        />

        <Input
          label={t('transactions.description')}
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={formData.type === 'income' 
            ? t('settings.recurringIncomeDescriptionPlaceholder')
            : t('settings.recurringExpenseDescriptionPlaceholder')
          }
          required
        />

        <Select
          label={formData.type === 'income' ? t('settings.depositToAccount') : t('settings.withdrawFromAccount')}
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
            {filteredCategories.map((category) => (
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

        <Input
          label={t('settings.endDate')}
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          helperText={t('settings.endDateHelper')}
        />

        <div className="bg-light-accent-light dark:bg-dark-accent-light rounded-xl p-4 text-sm">
          <p className="text-light-text-primary dark:text-dark-text-primary mb-2 font-medium">
            💡 {t('settings.howItWorks')}
          </p>
          <ul className="text-light-text-secondary dark:text-dark-text-secondary space-y-1 list-disc list-inside">
            <li>{t('settings.recurringInfo1')}</li>
            <li>{t('settings.recurringInfo2')}</li>
            {formData.endDate && (
              <li>{t('settings.recurringInfo4', { date: new Date(formData.endDate).toLocaleDateString(localeString) })}</li>
            )}
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
            {loading ? t('common.loading') : (isEditing ? t('settings.updateRecurringTransaction') : t('settings.createRecurringTransaction'))}
          </Button>
        </div>
      </form>

      {/* Category Modal - Pre-set type based on transaction type */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        defaultType={formData.type}
      />
    </Modal>
  )
}

