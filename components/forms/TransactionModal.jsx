'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

export function TransactionModal({ isOpen, onClose, accounts, categories, onSuccess, editingTransaction = null }) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const isEditing = !!editingTransaction
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    date: new Date().toISOString().slice(0, 16),
    notes: '',
  })

  // Load editing transaction data when modal opens
  useEffect(() => {
    if (isOpen && editingTransaction) {
      const date = new Date(editingTransaction.date)
      setFormData({
        type: editingTransaction.type,
        amount: String(editingTransaction.amount),
        description: editingTransaction.description,
        accountId: editingTransaction.accountId,
        categoryId: editingTransaction.categoryId || '',
        date: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        notes: editingTransaction.notes || '',
      })
    } else if (isOpen && !editingTransaction) {
      // Reset form for new transaction
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: '',
        date: new Date().toISOString().slice(0, 16),
        notes: '',
      })
    }
  }, [isOpen, editingTransaction, accounts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions'
      
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId || null,
          notes: formData.notes || null,
          date: new Date(formData.date).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || (isEditing ? 'Failed to update transaction' : 'Failed to create transaction'))
      }

      if (isEditing) {
        toast.success(t('transactions.updated'), t('transactions.updatedSuccess'))
      } else {
        toast.success(t('transactions.created'), t('transactions.createdSuccess'))
      }
      
      onSuccess?.()
      onClose()
      
      // Reset form
      if (!isEditing) {
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          accountId: accounts[0]?.id || '',
          categoryId: '',
          date: new Date().toISOString().slice(0, 16),
          notes: '',
        })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} transaction:`, error)
      toast.error(
        isEditing ? t('transactions.updateFailed') : t('transactions.createFailed'), 
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('transactions.editTransaction') : t('transactions.addTransaction')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label={t('transactions.type')}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
          required
        >
          <option value="expense">{t('transactions.expense')}</option>
          <option value="income">{t('transactions.income')}</option>
        </Select>

        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />

        <Input
          label={t('transactions.description')}
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('transactions.descriptionPlaceholder')}
          required
        />

        <Select
          label={t('transactions.account')}
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

        <Select
          label={t('transactions.category')}
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

        <Input
          label={t('transactions.date')}
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        <Input
          label={t('transactions.notes')}
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t('transactions.notesPlaceholder')}
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
            {loading ? t('common.loading') : (isEditing ? t('transactions.updateTransaction') : t('transactions.addTransaction'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

