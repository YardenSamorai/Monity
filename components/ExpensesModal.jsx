'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { TransactionModal } from './forms/TransactionModal'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { ArrowDownCircle, Repeat, Edit, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'

export function ExpensesModal({ isOpen, onClose, expenses, recurringExpenses, recurringExpenseDefinitions = [], accounts = [], categories = [], onExpenseUpdated }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [editingExpense, setEditingExpense] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [localExpenses, setLocalExpenses] = useState(expenses)

  // Get IDs of recurring expenses that already have transactions this month
  const recurringExpenseIdsWithTransactions = new Set(
    recurringExpenses.map(e => e.recurringTransactionId).filter(Boolean)
  )

  // Get IDs of actual recurring expense transactions (to filter them out from regular expenses)
  const recurringExpenseTransactionIds = new Set(
    recurringExpenses.map(e => e.id).filter(Boolean)
  )

  // Convert recurring expense definitions to expense-like objects for display
  // Only show recurring expenses that don't have a transaction yet (shouldn't happen for expenses, but just in case)
  const recurringExpenseAsExpenses = recurringExpenseDefinitions
    .filter(re => !recurringExpenseIdsWithTransactions.has(re.id))
    .map((re, index) => ({
      id: `recurring-def-${re.id}-${index}`, // Unique ID for pending recurring expenses
      description: re.description,
      amount: re.amount,
      date: new Date(re.nextRunDate || new Date()), // Use next run date or today
      account: re.account,
      category: re.category,
      isRecurring: true,
      isPending: true, // Mark as pending (transaction will be created on the scheduled day)
    }))

  // Separate recurring expenses from regular expenses
  const recurringExpensesList = [
    ...recurringExpenses.map((e, index) => ({ 
      ...e, 
      isRecurring: true, 
      isPending: false,
      id: `recurring-tx-${e.id}-${index}`, // Unique ID for recurring transactions
    })),
    ...recurringExpenseAsExpenses,
  ]

  // Regular expenses (non-recurring) - sorted by date, newest first
  // IMPORTANT: Filter out recurring expense transactions to avoid double counting
  const regularExpenses = localExpenses
    .filter(e => !recurringExpenseTransactionIds.has(e.id)) // Exclude recurring expense transactions
    .map(e => ({ ...e, isRecurring: false, isPending: false }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5) // Only show last 5 regular expenses

  // Combine: recurring expenses first, then regular expenses
  const allExpenses = [
    ...recurringExpensesList,
    ...regularExpenses,
  ]

  const total = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Update local expenses when props change
  useEffect(() => {
    setLocalExpenses(expenses)
  }, [expenses])

  const handleEdit = (expense) => {
    // Only allow editing non-recurring and non-pending expenses
    if (expense.isRecurring || expense.isPending || expense.id?.startsWith('recurring-')) {
      return
    }
    setEditingExpense(expense)
    setIsEditModalOpen(true)
  }

  const handleDelete = (expense) => {
    // Only allow deleting non-recurring and non-pending expenses
    if (expense.isRecurring || expense.isPending || expense.id?.startsWith('recurring-')) {
      return
    }
    setExpenseToDelete(expense)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return

    try {
      const response = await fetch(`/api/transactions/${expenseToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete transaction')
      }

      toast.success(t('transactions.deleted'), t('transactions.deletedSuccess'))
      
      // Remove from local state
      setLocalExpenses(localExpenses.filter(e => e.id !== expenseToDelete.id))
      
      // Notify parent to refresh
      onExpenseUpdated?.()
      
      setExpenseToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('transactions.deleteFailed'), error.message)
    }
  }

  const handleEditSuccess = async () => {
    // Refresh expenses
    const response = await fetch('/api/transactions')
    const data = await response.json()
    const monthlyExpenses = data.transactions.filter(t => t.type === 'expense')
    setLocalExpenses(monthlyExpenses)
    
    // Notify parent to refresh
    onExpenseUpdated?.()
    
    setIsEditModalOpen(false)
    setEditingExpense(null)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('dashboard.expenses')}
      size="lg"
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {t('dashboard.totalExpenses')}
            </span>
            <span className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {formatCurrency(total, { locale: localeString, symbol: currencySymbol })}
            </span>
          </div>
          <div className="mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            {recurringExpensesList.length > 0 && (
              <span>{recurringExpensesList.length} {t('dashboard.recurring')} • </span>
            )}
            {regularExpenses.length} {t('dashboard.recentExpenses')}
          </div>
        </div>

        {/* Expenses List */}
        {allExpenses.length === 0 ? (
          <div className="text-center py-8 text-light-text-tertiary dark:text-dark-text-tertiary">
            {t('dashboard.noExpenses')}
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {allExpenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-3 border border-light-border-light dark:border-dark-border-light rounded-xl hover:border-light-border dark:hover:border-dark-border transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-light-danger-light dark:bg-dark-danger-light flex items-center justify-center flex-shrink-0">
                    <ArrowDownCircle className="w-5 h-5 text-light-danger dark:text-dark-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                        {expense.description}
                      </span>
                      {expense.isRecurring && (
                        <Badge variant="default" className="text-xs flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {expense.isPending ? (
                            <span className="opacity-75">{t('dashboard.pendingRecurring')}</span>
                          ) : (
                            t('dashboard.recurring')
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {new Date(expense.date).toLocaleDateString(localeString, { day: 'numeric', month: 'short' })} • {expense.account?.name || ''} {expense.category?.name && `• ${expense.category.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <div className="font-semibold text-light-danger dark:text-dark-danger">
                      {formatCurrency(Number(expense.amount), { locale: localeString, symbol: currencySymbol })}
                    </div>
                  </div>
                  {/* Action buttons - only for non-recurring, non-pending expenses */}
                  {!expense.isRecurring && !expense.isPending && !expense.id?.startsWith('recurring-') && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(expense)
                        }}
                        className="h-9 w-9 p-0"
                        aria-label={t('common.edit')}
                      >
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(expense)
                        }}
                        className="h-9 w-9 p-0 text-light-danger dark:text-dark-danger hover:text-light-danger-dark dark:hover:text-dark-danger-dark"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingExpense && (
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingExpense(null)
          }}
          accounts={accounts}
          categories={categories}
          onSuccess={handleEditSuccess}
          editingTransaction={editingExpense}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setExpenseToDelete(null)
        }}
        title={t('transactions.deleteTransaction')}
        message={t('transactions.deleteConfirm') + (expenseToDelete?.description ? ` "${expenseToDelete.description}"?` : '?')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </Modal>
  )
}

