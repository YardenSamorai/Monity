'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import { Receipt, Plus, Search } from 'lucide-react'
import { Select } from '@/components/ui/Input'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { SwipeableTransactionItem } from '@/components/transactions/SwipeableTransactionItem'

export function TransactionsClient({ initialTransactions, accounts, categories }) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterAccount, setFilterAccount] = useState('all')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)

  const handleSuccess = async () => {
    // Refresh transactions
    const response = await fetch('/api/transactions')
    const data = await response.json()
    setTransactions(data.transactions)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    try {
      const response = await fetch(`/api/transactions/${transactionToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete transaction')
      }

      toast.success(t('transactions.deleted'), t('transactions.deletedSuccess'))
      
      // Remove from local state
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id))
      
      setTransactionToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('transactions.deleteFailed'), error.message)
    }
  }

  const handleEditSuccess = async () => {
    await handleSuccess()
    setIsEditModalOpen(false)
    setEditingTransaction(null)
  }

  // Filter logic
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesAccount = filterAccount === 'all' || transaction.accountId === filterAccount
    return matchesSearch && matchesType && matchesAccount
  })

  return (
    <>
      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
              <input
                type="text"
                placeholder={t('transactions.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-all"
              />
            </div>
          </div>
          
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="lg:w-40"
          >
            <option value="all">{t('transactions.all')}</option>
            <option value="income">{t('transactions.income')}</option>
            <option value="expense">{t('transactions.expense')}</option>
          </Select>

          <Select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="lg:w-48"
          >
            <option value="all">{t('transactions.filterByAccount')}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="overflow-visible">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-8 h-8" />}
            title={searchTerm || filterType !== 'all' || filterAccount !== 'all' ? t('transactions.noMatching') : t('dashboard.noTransactions')}
            description={searchTerm || filterType !== 'all' || filterAccount !== 'all' ? t('transactions.adjustFilters') : t('dashboard.startAdding')}
          />
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <SwipeableTransactionItem
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
                currencySymbol={currencySymbol}
                localeString={localeString}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={handleSuccess}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTransaction(null)
          }}
          accounts={accounts}
          categories={categories}
          onSuccess={handleEditSuccess}
          editingTransaction={editingTransaction}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setTransactionToDelete(null)
        }}
        title={t('transactions.deleteTransaction')}
        message={t('transactions.deleteConfirm') + (transactionToDelete?.description ? ` "${transactionToDelete.description}"?` : '?')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "fixed bottom-24 lg:bottom-8 z-50 w-14 h-14 rounded-full bg-light-accent dark:bg-dark-accent text-white shadow-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-transform",
          isRTL ? "left-4 lg:left-8" : "right-4 lg:right-8"
        )}
        aria-label={t('dashboard.addTransaction')}
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  )
}

