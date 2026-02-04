'use client'

import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Scissors, AlertCircle } from 'lucide-react'

export function SplitTransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  categories,
  accounts,
  onSuccess 
}) {
  const { toast } = useToast()
  const { t, currencySymbol, formatCurrency, localeString } = useI18n()
  const [loading, setLoading] = useState(false)
  const [splits, setSplits] = useState([])

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.type === transaction?.type || c.type === 'both'),
    [categories, transaction?.type]
  )

  // Initialize splits when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setSplits([
        {
          id: '1',
          amount: transaction.amount,
          categoryId: transaction.categoryId || '',
          description: transaction.description,
        }
      ])
    }
  }, [isOpen, transaction])

  const totalAmount = transaction?.amount || 0
  const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  const remaining = totalAmount - splitTotal
  const isBalanced = Math.abs(remaining) < 0.01

  const addSplit = () => {
    const newSplit = {
      id: Date.now().toString(),
      amount: remaining > 0 ? remaining : '',
      categoryId: '',
      description: '',
    }
    setSplits([...splits, newSplit])
  }

  const removeSplit = (id) => {
    if (splits.length <= 1) return
    setSplits(splits.filter(s => s.id !== id))
  }

  const updateSplit = (id, field, value) => {
    setSplits(splits.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isBalanced) {
      toast.error(t('split.error'), t('split.amountsMustMatch'))
      return
    }

    if (splits.length < 2) {
      toast.error(t('split.error'), t('split.needAtLeastTwo'))
      return
    }

    setLoading(true)

    try {
      // Delete the original transaction
      const deleteResponse = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      })

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete original transaction')
      }

      // Create new transactions for each split
      for (const split of splits) {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: transaction.type,
            amount: parseFloat(split.amount),
            description: split.description || transaction.description,
            accountId: transaction.accountId,
            categoryId: split.categoryId || null,
            date: transaction.date,
            notes: `${t('split.splitFrom')}: ${transaction.description}`,
            isShared: transaction.isShared,
            householdId: transaction.householdId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create split transaction')
        }
      }

      toast.success(t('split.success'), t('split.transactionSplit', { count: splits.length }))
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error splitting transaction:', error)
      toast.error(t('split.error'), error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('split.title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Original Transaction Info */}
        <div className="p-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {transaction.description}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('split.originalAmount')}
              </p>
            </div>
            <p className="text-lg font-bold text-[rgb(var(--text-primary))] tabular-nums">
              {formatCurrency(totalAmount, { locale: localeString, symbol: currencySymbol })}
            </p>
          </div>
        </div>

        {/* Splits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              {t('split.splitInto')}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSplit}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('split.addSplit')}
            </Button>
          </div>

          {splits.map((split, index) => (
            <div
              key={split.id}
              className="p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[rgb(var(--accent))]/20 text-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                {splits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSplit(split.id)}
                    className="ml-auto p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('transactions.amount')}
                  type="number"
                  step="0.01"
                  min="0"
                  value={split.amount}
                  onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                  placeholder="0.00"
                  required
                />

                <Select
                  label={t('transactions.category')}
                  value={split.categoryId}
                  onChange={(e) => updateSplit(split.id, 'categoryId', e.target.value)}
                >
                  <option value="">{t('transactions.uncategorized')}</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                label={t('transactions.description')}
                value={split.description}
                onChange={(e) => updateSplit(split.id, 'description', e.target.value)}
                placeholder={transaction.description}
                className="mt-3"
              />
            </div>
          ))}
        </div>

        {/* Balance Indicator */}
        <div className={cn(
          "p-3 rounded-xl border flex items-center justify-between",
          isBalanced
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}>
          <div className="flex items-center gap-2">
            {!isBalanced && <AlertCircle className="w-4 h-4 text-amber-500" />}
            <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              {isBalanced ? t('split.balanced') : t('split.remaining')}
            </span>
          </div>
          <span className={cn(
            "font-bold tabular-nums",
            isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {isBalanced 
              ? '✓' 
              : formatCurrency(remaining, { locale: localeString, symbol: currencySymbol })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!isBalanced || splits.length < 2}
            className="flex-1"
          >
            <Scissors className="w-4 h-4 mr-2" />
            {t('split.splitTransaction')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
