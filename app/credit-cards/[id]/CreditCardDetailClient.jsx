'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  CreditCard as CreditCardIcon,
  Plus,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Tag,
  Receipt,
  TrendingDown
} from 'lucide-react'

export function CreditCardDetailClient({ cardId }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const router = useRouter()

  const [card, setCard] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, billed, all
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [cardId, filter])

  const fetchData = async () => {
    try {
      const [cardRes, categoriesRes] = await Promise.all([
        fetch(`/api/credit-cards/${cardId}?status=${filter === 'all' ? '' : filter}`),
        fetch('/api/categories'),
      ])

      if (!cardRes.ok) {
        router.push('/credit-cards')
        return
      }

      const cardData = await cardRes.json()
      const categoriesData = await categoriesRes.json()

      setCard(cardData.creditCard)
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!card) {
    return null
  }

  const limitUsedPercent = card.creditLimit
    ? Math.round((Number(card.pendingAmount) / Number(card.creditLimit)) * 100)
    : null
  const isNearLimit = limitUsedPercent !== null && limitUsedPercent >= 80

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/credit-cards')}
          className="p-2 rounded-xl hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
        </button>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${card.color}20` }}
          >
            <CreditCardIcon className="w-6 h-6" style={{ color: card.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {card.name}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              •••• {card.lastFourDigits} • {card.linkedAccount?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('creditCards.pendingCharges')}
          </p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(card.pendingAmount, { locale: localeString, symbol: currencySymbol })}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('creditCards.billingDate')}
          </p>
          <p className="text-xl font-bold text-[rgb(var(--text-primary))]">
            {t('creditCards.dayOfMonth', { day: card.billingDay })}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('creditCards.inDays', { days: card.daysUntilBilling })}
          </p>
        </Card>

        {card.creditLimit && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('creditCards.limitUsed')}
              </p>
              <p className={cn(
                "text-xl font-bold",
                isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-[rgb(var(--text-primary))]"
              )}>
                {limitUsedPercent}%
              </p>
              {isNearLimit && (
                <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  {t('creditCards.nearingLimit')}
                </p>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('creditCards.creditLimit')}
              </p>
              <p className="text-xl font-bold text-[rgb(var(--text-primary))]">
                {formatCurrency(card.creditLimit, { locale: localeString, symbol: currencySymbol })}
              </p>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    isNearLimit ? "bg-amber-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(limitUsedPercent, 100)}%` }}
                />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Filter & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[rgb(var(--bg-secondary))] rounded-lg p-1 border border-[rgb(var(--border-primary))]">
          {['pending', 'billed', 'all'].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                filter === option
                  ? "bg-blue-600 text-white"
                  : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
              )}
            >
              {t(`creditCards.filter${option.charAt(0).toUpperCase() + option.slice(1)}`)}
            </button>
          ))}
        </div>

        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 me-2" />
          {t('creditCards.addTransaction')}
        </Button>
      </div>

      {/* Transactions List */}
      {card.transactions?.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Receipt className="w-12 h-12" />}
            title={t('creditCards.noTransactions')}
            description={t('creditCards.noTransactionsDesc')}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden divide-y divide-[rgb(var(--border-primary))]">
          {card.transactions?.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currencySymbol={currencySymbol}
              localeString={localeString}
            />
          ))}
        </Card>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        cardId={cardId}
        categories={categories}
        onSuccess={() => {
          setIsAddModalOpen(false)
          fetchData()
        }}
      />
    </div>
  )
}

// Transaction Row Component
function TransactionRow({ transaction, currencySymbol, localeString }) {
  const { t } = useI18n()
  const isPending = transaction.status === 'pending'

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
      {/* Category Icon */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ 
          backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : 'rgb(var(--bg-tertiary))',
        }}
      >
        <Tag 
          className="w-5 h-5" 
          style={{ color: transaction.category?.color || 'rgb(var(--text-tertiary))' }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--text-primary))] truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {new Date(transaction.date).toLocaleDateString(localeString)}
          </span>
          {transaction.category && (
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${transaction.category.color}20`,
                color: transaction.category.color
              }}
            >
              {transaction.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Amount & Status */}
      <div className="text-end">
        <p className="font-semibold text-rose-600 dark:text-rose-400">
          -{formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
        </p>
        <div className={cn(
          "inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full",
          isPending 
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        )}>
          {isPending ? (
            <Clock className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {t(`creditCards.status${isPending ? 'Pending' : 'Billed'}`)}
        </div>
      </div>
    </div>
  )
}

// Add Transaction Modal
function AddTransactionModal({ isOpen, onClose, cardId, categories, onSuccess }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    showLoading()

    try {
      const response = await fetch(`/api/credit-cards/${cardId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success(t('creditCards.transactionAdded'))
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        notes: '',
      })
      onSuccess()
    } catch (error) {
      toast.error(t('creditCards.transactionAddFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('creditCards.addTransaction')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('transactions.descriptionPlaceholder')}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('transactions.date')}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('transactions.category')}
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
            >
              <option value="">{t('transactions.uncategorized')}</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={t('transactions.notes')}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t('transactions.notesPlaceholder')}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1">
            {t('creditCards.addTransaction')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
