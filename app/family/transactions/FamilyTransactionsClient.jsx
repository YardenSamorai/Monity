'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Search,
  Plus,
  Download,
  Filter,
  Wallet,
  Receipt,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { SwipeableTransactionItem } from '@/components/transactions/SwipeableTransactionItem'

export function FamilyTransactionsClient() {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  
  // Data state
  const [household, setHousehold] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState(null)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [onlyMyTransactions, setOnlyMyTransactions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Grouping state
  const [groupBy, setGroupBy] = useState('day') // day, member, category

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch everything in parallel
      const [householdData, transactionsData, categoriesData, accountsData, creditCardsData] = await Promise.all([
        fetch('/api/households', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/transactions?onlyShared=true', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/categories', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/accounts', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/credit-cards', { cache: 'no-store' }).then(res => res.json()),
      ])

      const hh = householdData.household
      setHousehold(hh)
      
      // Also fetch shared credit card transactions
      const allCCTransactions = []
      for (const card of (creditCardsData.creditCards || [])) {
        try {
          const ccTxRes = await fetch(`/api/credit-cards/${card.id}/transactions?status=pending`, { cache: 'no-store' })
          const ccTxData = await ccTxRes.json()
          
          const sharedCCTransactions = (ccTxData.transactions || [])
            .filter(tx => tx.isShared && tx.householdId === hh?.id)
            .map(tx => ({
              id: tx.id,
              type: 'expense',
              amount: tx.amount,
              description: tx.description,
              date: tx.date,
              notes: tx.notes,
              isShared: true,
              isCreditCard: true,
              creditCardId: card.id, // Store credit card ID for deletion
              creditCardStatus: tx.status,
              userId: tx.userId,
              account: {
                id: card.id,
                name: `${card.name} •••• ${card.lastFourDigits}`,
                type: 'credit',
              },
              category: tx.category,
            }))
          
          allCCTransactions.push(...sharedCCTransactions)
        } catch (error) {
          console.error(`Error fetching CC transactions for card ${card.id}:`, error)
        }
      }
      
      // Merge regular shared transactions + shared CC transactions
      const allTransactions = [
        ...(transactionsData.transactions || []),
        ...allCCTransactions,
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setTransactions(allTransactions)
      setCategories(categoriesData.categories || [])
      setAccounts(accountsData.accounts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time updates
  useDataRefresh({
    key: 'family-transactions-page',
    fetchFn: fetchData,
    events: [
      EVENTS.FAMILY_TRANSACTION,
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.MEMBER_JOINED,
      EVENTS.MEMBER_LEFT,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Member filter
      if (selectedMember && t.userId !== selectedMember) {
        return false
      }
      // Category filter
      if (selectedCategory && t.category?.id !== selectedCategory) {
        return false
      }
      // Type filter
      if (selectedType && t.type !== selectedType) {
        return false
      }
      // Date range
      if (dateFrom && new Date(t.date) < new Date(dateFrom)) {
        return false
      }
      if (dateTo && new Date(t.date) > new Date(dateTo + 'T23:59:59')) {
        return false
      }
      // Only my transactions
      if (onlyMyTransactions) {
        const currentMember = household?.members?.find(m => m.isCurrentUser)
        if (currentMember && t.userId !== currentMember.userId) {
          return false
        }
      }
      return true
    })
  }, [transactions, searchQuery, selectedMember, selectedCategory, selectedType, dateFrom, dateTo, onlyMyTransactions, household])

  // Calculate summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      income,
      expenses,
      net: income - expenses,
      count: filteredTransactions.length,
    }
  }, [filteredTransactions])

  // Group transactions
  const groupedTransactions = useMemo(() => {
    const groups = {}
    
    filteredTransactions.forEach(t => {
      let key
      let label
      
      switch (groupBy) {
        case 'member':
          const member = household?.members?.find(m => m.userId === t.userId)
          key = t.userId || 'unknown'
          label = member?.name || member?.email?.split('@')[0] || t('family.unknownMember')
          break
        case 'category':
          key = t.category?.id || 'uncategorized'
          label = t.category?.name || t('transactions.uncategorized')
          break
        case 'day':
        default:
          const date = new Date(t.date)
          key = date.toISOString().split('T')[0]
          label = date.toLocaleDateString(localeString, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
      }
      
      if (!groups[key]) {
        groups[key] = { label, transactions: [], total: 0 }
      }
      groups[key].transactions.push(t)
      groups[key].total += t.type === 'expense' ? -Number(t.amount) : Number(t.amount)
    })
    
    // Sort groups
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'day') return b.localeCompare(a)
      return groups[b].transactions.length - groups[a].transactions.length
    })
    
    return sortedKeys.map(key => ({ key, ...groups[key] }))
  }, [filteredTransactions, groupBy, household, localeString, t])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedMember('')
    setSelectedCategory('')
    setSelectedType('')
    setDateFrom('')
    setDateTo('')
    setOnlyMyTransactions(false)
  }

  const hasActiveFilters = searchQuery || selectedMember || selectedCategory || selectedType || dateFrom || dateTo || onlyMyTransactions

  // Handle edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  // Handle delete
  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  // Handle view details
  const handleView = (transaction) => {
    setViewingTransaction(transaction)
    setIsDetailModalOpen(true)
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return
    setIsDeleting(true)
    try {
      let response
      
      // Check if this is a credit card transaction
      if (transactionToDelete.isCreditCard && transactionToDelete.creditCardId) {
        // Delete credit card transaction
        response = await fetch(`/api/credit-cards/${transactionToDelete.creditCardId}/transactions/${transactionToDelete.id}`, {
          method: 'DELETE',
          cache: 'no-store',
        })
      } else {
        // Delete regular transaction
        response = await fetch(`/api/transactions/${transactionToDelete.id}`, {
          method: 'DELETE',
          cache: 'no-store',
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete')
      }
      
      toast.success(t('transactions.deleted'))
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id))
      setTransactionToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(t('transactions.deleteFailed'), error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle success after edit
  const handleSuccess = async () => {
    await fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!household) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <EmptyState
            icon={<Receipt className="w-12 h-12" />}
            title={t('family.noHousehold')}
            description={t('family.noHouseholdDesc')}
          />
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/family'}
          >
            {t('family.goToFamily')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {t('familyTransactions.title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            {t('familyTransactions.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4 me-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('familyTransactions.searchPlaceholder')}
            className="w-full h-11 ps-10 pe-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]"
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 me-2" />
          {t('common.filter')}
          {hasActiveFilters && (
            <span className="absolute -top-1 -end-1 w-3 h-3 bg-blue-600 rounded-full" />
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[rgb(var(--text-primary))]">
              {t('familyTransactions.filters')}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('familyTransactions.clearFilters')}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Member */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('familyTransactions.member')}
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
              >
                <option value="">{t('familyTransactions.allMembers')}</option>
                {household.members.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.email?.split('@')[0]}
                    {m.isCurrentUser && ` (${t('family.you')})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('familyTransactions.category')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
              >
                <option value="">{t('familyTransactions.allCategories')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('familyTransactions.type')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
              >
                <option value="">{t('familyTransactions.allTypes')}</option>
                <option value="income">{t('transactions.income')}</option>
                <option value="expense">{t('transactions.expense')}</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('familyTransactions.dateFrom')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('familyTransactions.dateTo')}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
              />
            </div>

            {/* Only My Transactions Toggle */}
            <div className="col-span-2 lg:col-span-2 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyMyTransactions}
                  onChange={(e) => setOnlyMyTransactions(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  {t('familyTransactions.onlyMyTransactions')}
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label={t('familyTransactions.totalIncome')}
          value={formatCurrency(summary.income, { locale: localeString, symbol: currencySymbol })}
          icon={ArrowUpRight}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          label={t('familyTransactions.totalExpenses')}
          value={formatCurrency(summary.expenses, { locale: localeString, symbol: currencySymbol })}
          icon={ArrowDownRight}
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-600 dark:text-rose-400"
          valueColor="text-rose-600 dark:text-rose-400"
        />
        <SummaryCard
          label={t('familyTransactions.netBalance')}
          value={formatCurrency(Math.abs(summary.net), { locale: localeString, symbol: currencySymbol })}
          icon={Wallet}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
          valueColor={summary.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          prefix={summary.net >= 0 ? '+' : '-'}
        />
        <SummaryCard
          label={t('familyTransactions.transactionCount')}
          value={summary.count.toString()}
          icon={Receipt}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          valueColor="text-[rgb(var(--text-primary))]"
        />
      </div>

      {/* Group By Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('familyTransactions.groupBy')}:
        </span>
        <div className="flex bg-[rgb(var(--bg-secondary))] rounded-lg p-1 border border-[rgb(var(--border-primary))]">
          {['day', 'member', 'category'].map((option) => (
            <button
              key={option}
              onClick={() => setGroupBy(option)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                groupBy === option
                  ? "bg-blue-600 text-white"
                  : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
              )}
            >
              {t(`familyTransactions.groupBy${option.charAt(0).toUpperCase() + option.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Receipt className="w-12 h-12" />}
            title={hasActiveFilters ? t('familyTransactions.noResultsTitle') : t('familyTransactions.emptyTitle')}
            description={hasActiveFilters ? t('familyTransactions.noResultsDesc') : t('familyTransactions.emptyDesc')}
          />
          {hasActiveFilters && (
            <div className="text-center mt-4">
              <Button variant="secondary" onClick={clearFilters}>
                {t('familyTransactions.clearFilters')}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group) => (
            <TransactionGroup
              key={group.key}
              label={group.label}
              transactions={group.transactions}
              total={group.total}
              household={household}
              currencySymbol={currencySymbol}
              localeString={localeString}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        accounts={accounts}
        categories={categories}
        household={household}
        editingTransaction={editingTransaction}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setTransactionToDelete(null)
        }}
        title={t('transactions.deleteTransaction')}
        message={t('transactions.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setViewingTransaction(null)
        }}
        transaction={viewingTransaction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currencySymbol={currencySymbol}
        localeString={localeString}
      />
    </div>
  )
}

// Summary Card Component
function SummaryCard({ label, value, icon: Icon, iconBg, iconColor, valueColor, prefix = '' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <p className="text-xs text-[rgb(var(--text-tertiary))]">{label}</p>
      <p className={cn("text-xl font-bold mt-1", valueColor)}>
        {prefix}{value}
      </p>
    </Card>
  )
}

// Transaction Group Component
function TransactionGroup({ label, transactions, total, household, currencySymbol, localeString, onEdit, onDelete, onView }) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-[rgb(var(--text-primary))]">{label}</span>
          <span className="text-sm text-[rgb(var(--text-tertiary))]">
            {transactions.length} {t('familyTransactions.transactions')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-semibold",
            total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {total >= 0 ? '+' : ''}
            {formatCurrency(total, { locale: localeString, symbol: currencySymbol })}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          )}
        </div>
      </button>

      {/* Transactions */}
      {isExpanded && (
        <div className="divide-y divide-[rgb(var(--border-secondary))]">
          {transactions.map((transaction) => (
            <SwipeableTransactionItem
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              currencySymbol={currencySymbol}
              localeString={localeString}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
