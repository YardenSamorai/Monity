'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { SwipeableTransactionItem } from '@/components/transactions/SwipeableTransactionItem'
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal'
import { SplitTransactionModal } from '@/components/transactions/SplitTransactionModal'
import { cn, formatCurrency, getBillingCycleRange, getBillingCycleForDate } from '@/lib/utils'
import { Receipt, Plus, Search, ArrowUpRight, ArrowDownRight, ArrowRight, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { LinkTransactionModal } from '@/components/goals/LinkTransactionModal'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function TransactionsClient({ initialTransactions, accounts, categories, monthStartDay = 1 }) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const { toast } = useToast()
  const isHebrew = localeString?.startsWith('he')
  const monthNames = isHebrew ? HEBREW_MONTHS : ENGLISH_MONTHS

  // Current billing cycle
  const now = new Date()
  const initialCycle = getBillingCycleForDate(now, monthStartDay)

  const [viewYear, setViewYear] = useState(initialCycle.year)
  const [viewMonth, setViewMonth] = useState(initialCycle.month)
  const [customRange, setCustomRange] = useState(null) // { start, end } or null
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [transactionToLink, setTransactionToLink] = useState(null)
  const [goals, setGoals] = useState([])
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState(null)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [transactionToSplit, setTransactionToSplit] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filtersRef] = useState({ advancedFilters: {}, filterType: 'all', includeShared: false, household: null })

  useEffect(() => {
    fetch('/api/goals', { cache: 'no-store' }).then(res => res.json()).then(data => setGoals(data.goals || [])).catch(() => {})
    fetch('/api/households', { cache: 'no-store' }).then(res => res.json()).then(data => { if (data.household) setHousehold(data.household) }).catch(() => {})
  }, [])

  const CARD_TYPE_NAMES = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    diners: 'Diners Club',
    discover: 'Discover',
    isracard: 'Isracard',
    cal: 'Cal',
    max: 'Max',
    other: 'Card',
  }

  useEffect(() => {
    filtersRef.advancedFilters = advancedFilters
    filtersRef.filterType = filterType
    filtersRef.includeShared = includeShared
    filtersRef.household = household
  }, [advancedFilters, filterType, includeShared, household, filtersRef])

  // Determine the active date range (either custom or billing cycle)
  const activeDateRange = useMemo(() => {
    if (customRange) return customRange
    return getBillingCycleRange(viewYear, viewMonth, monthStartDay)
  }, [viewYear, viewMonth, monthStartDay, customRange])

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      const filters = filtersRef.advancedFilters

      params.append('startDate', activeDateRange.start.toISOString())
      params.append('endDate', activeDateRange.end.toISOString())

      if (filters.minAmount) params.append('minAmount', filters.minAmount)
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)
      if (filters.search) params.append('search', filters.search)
      if (filters.accountId) params.append('accountId', filters.accountId)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filtersRef.filterType !== 'all') params.append('type', filtersRef.filterType)
      if (filtersRef.household) params.append('includeShared', 'true')

      const [transactionsRes, creditCardsRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`, { cache: 'no-store' }),
        fetch('/api/credit-cards', { cache: 'no-store' }),
      ])

      const transactionsData = await transactionsRes.json()
      const creditCardsData = await creditCardsRes.json()

      const allCCTransactions = []
      for (const card of (creditCardsData.creditCards || [])) {
        const ccTxRes = await fetch(`/api/credit-cards/${card.id}/transactions?startDate=${activeDateRange.start.toISOString()}&endDate=${activeDateRange.end.toISOString()}`, { cache: 'no-store' })
        const ccTxData = await ccTxRes.json()

        const transformed = (ccTxData.transactions || []).map(ccTx => ({
          id: ccTx.id,
          type: 'expense',
          amount: ccTx.amount,
          description: ccTx.description,
          date: ccTx.date,
          notes: ccTx.notes,
          isShared: false,
          isCreditCard: true,
          creditCardStatus: ccTx.status,
          account: {
            id: card.id,
            name: `${CARD_TYPE_NAMES[card.name] || card.name} •••• ${card.lastFourDigits}`,
            type: 'credit',
          },
          category: ccTx.category,
          savingsGoal: null,
          tags: [],
        }))

        allCCTransactions.push(...transformed)
      }

      const allTransactions = [...(transactionsData.transactions || []), ...allCCTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      setTransactions(allTransactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeDateRange, filtersRef])

  // Refetch when month/range changes
  useEffect(() => {
    fetchTransactions()
  }, [viewYear, viewMonth, customRange, fetchTransactions])

  useDataRefresh({
    key: 'transactions-page',
    fetchFn: fetchTransactions,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.CREDIT_CARD_TRANSACTION,
      EVENTS.CREDIT_CARD_TRANSACTION_UPDATED,
      EVENTS.CREDIT_CARD_TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  // Month navigation
  const goToPrevMonth = () => {
    setCustomRange(null)
    setViewMonth(prev => {
      if (prev === 1) { setViewYear(y => y - 1); return 12 }
      return prev - 1
    })
  }

  const goToNextMonth = () => {
    setCustomRange(null)
    setViewMonth(prev => {
      if (prev === 12) { setViewYear(y => y + 1); return 1 }
      return prev + 1
    })
  }

  const isCurrentMonth = viewYear === initialCycle.year && viewMonth === initialCycle.month && !customRange

  const applyCustomRange = () => {
    if (!dateFrom || !dateTo) return
    setCustomRange({
      start: new Date(dateFrom + 'T00:00:00'),
      end: new Date(dateTo + 'T23:59:59.999'),
    })
    setShowDatePicker(false)
  }

  const clearCustomRange = () => {
    setCustomRange(null)
    setDateFrom('')
    setDateTo('')
    setViewYear(initialCycle.year)
    setViewMonth(initialCycle.month)
  }

  const handleSuccess = async () => {
    await fetchTransactions()
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (transaction) => {
    setViewingTransaction(transaction)
    setIsDetailModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return
    setIsDeleting(true)
    try {
      const url = transactionToDelete.isCreditCard
        ? `/api/credit-cards/${transactionToDelete.account.id}/transactions/${transactionToDelete.id}`
        : `/api/transactions/${transactionToDelete.id}`

      const response = await fetch(url, { method: 'DELETE', cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success(t('transactions.deleted'))
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id))
      setTransactionToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('transactions.deleteFailed'), error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesType
  })

  // Summary calculations
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return { income, expenses, net: income - expenses }
  }, [filteredTransactions])

  // Running balance computation (only when no type/search filters active)
  const hasFilters = filterType !== 'all' || searchTerm || Object.values(advancedFilters).some(v => v !== '' && v !== undefined)

  const runningBalances = useMemo(() => {
    if (hasFilters) return {}

    const balanceMap = {}
    const accountBalances = {}
    accounts.forEach(acc => {
      accountBalances[acc.id] = Number(acc.balance)
    })

    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))

    for (const tx of sorted) {
      if (tx.isCreditCard) continue
      const accId = tx.account?.id
      if (!accId || !accountBalances.hasOwnProperty(accId)) continue

      balanceMap[tx.id] = accountBalances[accId]

      // Walk backwards: undo this transaction to get the balance before it
      if (tx.type === 'income') {
        accountBalances[accId] -= Number(tx.amount)
      } else if (tx.type === 'expense') {
        accountBalances[accId] += Number(tx.amount)
      }
    }

    return balanceMap
  }, [filteredTransactions, accounts, hasFilters])

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString(localeString)
    if (!groups[date]) groups[date] = []
    groups[date].push(transaction)
    return groups
  }, {})

  // Month display label
  const monthLabel = customRange
    ? `${customRange.start.toLocaleDateString(localeString, { day: 'numeric', month: 'short' })} - ${customRange.end.toLocaleDateString(localeString, { day: 'numeric', month: 'short' })}`
    : `${monthNames[viewMonth - 1]} ${viewYear}`

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="px-4 py-4 lg:px-6 lg:py-6">

        {/* Month Navigation Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-2">
            <button
              onClick={goToPrevMonth}
              disabled={!!customRange}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors disabled:opacity-30"
            >
              {isRTL ? <ChevronRight className="w-5 h-5 text-[rgb(var(--text-primary))]" /> : <ChevronLeft className="w-5 h-5 text-[rgb(var(--text-primary))]" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[rgb(var(--text-primary))]">
                {monthLabel}
              </span>
              {customRange && (
                <button onClick={clearCustomRange} className="p-1 rounded-full hover:bg-[rgb(var(--bg-tertiary))]">
                  <X className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!isCurrentMonth && !customRange && (
                <button
                  onClick={() => { setViewYear(initialCycle.year); setViewMonth(initialCycle.month) }}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/20 transition-colors"
                >
                  {t('transactions.today')}
                </button>
              )}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showDatePicker || customRange
                    ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]"
                    : "hover:bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]"
                )}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextMonth}
                disabled={!!customRange}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors disabled:opacity-30"
              >
                {isRTL ? <ChevronLeft className="w-5 h-5 text-[rgb(var(--text-primary))]" /> : <ChevronRight className="w-5 h-5 text-[rgb(var(--text-primary))]" />}
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showDatePicker && (
            <div className="mt-2 p-4 bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">
                    {t('transactions.dateFrom')}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">
                    {t('transactions.dateTo')}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowDatePicker(false); setDateFrom(''); setDateTo('') }}
                  className="px-3 py-1.5 text-sm rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={applyCustomRange}
                  disabled={!dateFrom || !dateTo}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[rgb(var(--accent))] text-white hover:opacity-90 disabled:opacity-40"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                {t('transactions.income')}
              </span>
            </div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" dir="ltr">
              {formatCurrency(summary.income, { locale: localeString, symbol: currencySymbol })}
            </p>
          </div>
          <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                {t('transactions.expense')}
              </span>
            </div>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums" dir="ltr">
              {formatCurrency(summary.expenses, { locale: localeString, symbol: currencySymbol })}
            </p>
          </div>
          <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
              <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                {t('transactions.net')}
              </span>
            </div>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              summary.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )} dir="ltr">
              {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net, { locale: localeString, symbol: currencySymbol })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
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

        {/* Transaction count */}
        <div className="mb-3 px-1">
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {filteredTransactions.length} {t('transactions.count')}
          </p>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-pulse text-[rgb(var(--text-tertiary))]">
              {t('common.loading')}
            </div>
          </Card>
        ) : filteredTransactions.length === 0 ? (
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
                      onView={handleView}
                      onLinkGoal={() => { setTransactionToLink(transaction); setIsLinkModalOpen(true) }}
                      currencySymbol={currencySymbol}
                      localeString={localeString}
                      balanceAfter={runningBalances[transaction.id]}
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
        loading={isDeleting}
      />

      <LinkTransactionModal
        isOpen={isLinkModalOpen}
        onClose={() => { setIsLinkModalOpen(false); setTransactionToLink(null) }}
        transaction={transactionToLink}
        goals={goals}
        onSuccess={handleSuccess}
      />

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setViewingTransaction(null) }}
        transaction={viewingTransaction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSplit={(transaction) => {
          setIsDetailModalOpen(false)
          setViewingTransaction(null)
          setTransactionToSplit(transaction)
          setIsSplitModalOpen(true)
        }}
        currencySymbol={currencySymbol}
        localeString={localeString}
      />

      <SplitTransactionModal
        isOpen={isSplitModalOpen}
        onClose={() => { setIsSplitModalOpen(false); setTransactionToSplit(null) }}
        transaction={transactionToSplit}
        categories={categories}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
