'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

export function BudgetModal({ isOpen, onClose, categories, month, year, onSuccess, editingBudget = null }) {
  const { toast } = useToast()
  const { t, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const isEditing = !!editingBudget

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
  })

  useEffect(() => {
    if (isOpen && editingBudget) {
      setFormData({
        categoryId: editingBudget.categoryId || '',
        amount: String(editingBudget.amount),
      })
    } else if (isOpen && !editingBudget) {
      // Reset form for new budget
      setFormData({
        categoryId: '',
        amount: '',
      })
    }
  }, [isOpen, editingBudget])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/budgets/${editingBudget.id}` : '/api/budgets'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId || null,
          month: editingBudget?.month || month,
          year: editingBudget?.year || year,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || (isEditing ? t('budget.updateFailed') : t('budget.createFailed')))
      }

      toast.success(
        isEditing ? t('budget.updated') : t('budget.created'),
        isEditing ? t('budget.updatedSuccess') : t('budget.createdSuccess')
      )
      onSuccess?.()
      onClose()
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          categoryId: '',
          amount: '',
        })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} budget:`, error)
      toast.error(
        isEditing ? t('budget.updateFailed') : t('budget.createFailed'),
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? t('budget.editBudget') : t('budget.createBudget')} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label={t('transactions.category')}
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          disabled={isEditing} // Category cannot be changed when editing
        >
          <option value="">{t('budget.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Input
          label={t('budget.amount')}
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          helperText={t('budget.budgetFor', { month: new Date(editingBudget?.year || year, (editingBudget?.month || month) - 1).toLocaleDateString(localeString, { month: 'long', year: 'numeric' }) })}
          required
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
            {loading ? t('common.loading') : (isEditing ? t('budget.setBudget') : t('budget.setBudget'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
