'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagSelector } from '@/components/tags/TagSelector'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

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
    isShared: false,
  })
  const [transactionTags, setTransactionTags] = useState([])
  const [household, setHousehold] = useState(null)

  // Load household when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/households')
        .then(res => res.json())
        .then(data => {
          if (data.household) {
            setHousehold(data.household)
          }
        })
        .catch(() => {})
    }
  }, [isOpen])

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
        isShared: editingTransaction.isShared || false,
      })
      // Load tags for editing transaction
      if (editingTransaction.tags) {
        setTransactionTags(editingTransaction.tags)
      } else {
        setTransactionTags([])
      }
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
        isShared: false,
      })
      setTransactionTags([])
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
          isShared: formData.isShared && household ? true : false,
          householdId: formData.isShared && household ? household.id : null,
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
          isShared: false,
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

        {/* Shared toggle - only show if user has household */}
        {household && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <div className="flex-1">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                {t('transactions.shared')}
              </label>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                {t('transactions.sharedDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isShared: !formData.isShared })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 flex-shrink-0',
                formData.isShared
                  ? 'bg-light-accent dark:bg-dark-accent'
                  : 'bg-light-border dark:bg-dark-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  formData.isShared ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        )}

        {/* Tags - only show when editing */}
        {isEditing && editingTransaction && (
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              {t('tags.tags')}
            </label>
            <TagSelector
              transactionId={editingTransaction.id}
              selectedTags={transactionTags}
              onTagsChange={setTransactionTags}
            />
          </div>
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
            {loading ? t('common.loading') : (isEditing ? t('transactions.updateTransaction') : t('transactions.addTransaction'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

