'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { SwipeableTransactionItem } from '@/components/transactions/SwipeableTransactionItem'
import { cn, formatCurrency } from '@/lib/utils'
import { Receipt, Plus, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { LinkTransactionModal } from '@/components/goals/LinkTransactionModal'

export function TransactionsClient({ initialTransactions, accounts, categories }) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [includeShared, setIncludeShared] = useState(false)
  const [household, setHousehold] = useState(null)
  const [advancedFilters, setAdvancedFilters] = useState({})
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [transactionToLink, setTransactionToLink] = useState(null)
  const [goals, setGoals] = useState([])

  useEffect(() => {
    fetch('/api/goals').then(res => res.json()).then(data => setGoals(data.goals || [])).catch(() => {})
    fetch('/api/households').then(res => res.json()).then(data => { if (data.household) setHousehold(data.household) }).catch(() => {})
  }, [])

  const handleSuccess = async () => {
    const params = new URLSearchParams()
    if (advancedFilters.startDate) params.append('startDate', advancedFilters.startDate)
    if (advancedFilters.endDate) params.append('endDate', advancedFilters.endDate)
    if (advancedFilters.minAmount) params.append('minAmount', advancedFilters.minAmount)
    if (advancedFilters.maxAmount) params.append('maxAmount', advancedFilters.maxAmount)
    if (advancedFilters.search) params.append('search', advancedFilters.search)
    if (filterType !== 'all') params.append('type', filterType)
    if (includeShared && household) params.append('includeShared', 'true')
    
    const response = await fetch(`/api/transactions?${params.toString()}`)
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
      const response = await fetch(`/api/transactions/${transactionToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success(t('transactions.deleted'))
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id))
      setTransactionToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('transactions.deleteFailed'), error.message)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesType
  })

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString(localeString)
    if (!groups[date]) groups[date] = []
    groups[date].push(transaction)
    return groups
  }, {})

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
            {t('nav.transactions')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            {filteredTransactions.length} {t('transactions.count')}
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]",
              isRTL ? "right-3" : "left-3"
            )} />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full h-10 rounded-md bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]",
                "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30 focus:border-[rgb(var(--accent))]",
                isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
              )}
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  filterType === type
                    ? 'bg-[rgb(var(--accent))] text-white'
                    : 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                )}
              >
                {t(`transactions.${type}`)}
              </button>
            ))}
            
            <AdvancedFilters
              onApply={(filters) => {
                setAdvancedFilters(filters)
                handleSuccess()
              }}
              onClear={() => {
                setAdvancedFilters({})
                handleSuccess()
              }}
              accounts={accounts}
              categories={categories}
            />
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<Receipt className="w-6 h-6" />}
              title={searchTerm || filterType !== 'all' ? t('transactions.noMatching') : t('dashboard.noTransactions')}
              description={searchTerm || filterType !== 'all' ? t('transactions.adjustFilters') : t('dashboard.startAdding')}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <div key={date}>
                <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mb-2 px-1">
                  {date}
                </div>
                <Card padding={false} className="divide-y divide-[rgb(var(--border-secondary))] overflow-hidden">
                  {dayTransactions.map((transaction) => (
                    <SwipeableTransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onLinkGoal={() => { setTransactionToLink(transaction); setIsLinkModalOpen(true); }}
                      currencySymbol={currencySymbol}
                      localeString={localeString}
                    />
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "fixed bottom-20 lg:bottom-6 z-40 w-12 h-12 rounded-full",
          "bg-[rgb(var(--accent))] text-white shadow-lg",
          "flex items-center justify-center",
          "hover:opacity-90 active:scale-95 transition-all",
          isRTL ? "left-4 lg:left-6" : "right-4 lg:right-6"
        )}
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        categories={categories}
        household={household}
        onSuccess={handleSuccess}
      />

      {editingTransaction && (
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingTransaction(null) }}
          accounts={accounts}
          categories={categories}
          household={household}
          onSuccess={() => { handleSuccess(); setIsEditModalOpen(false); setEditingTransaction(null) }}
          editingTransaction={editingTransaction}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setTransactionToDelete(null) }}
        title={t('transactions.deleteTransaction')}
        message={t('transactions.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      <LinkTransactionModal
        isOpen={isLinkModalOpen}
        onClose={() => { setIsLinkModalOpen(false); setTransactionToLink(null) }}
        transaction={transactionToLink}
        goals={goals}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
