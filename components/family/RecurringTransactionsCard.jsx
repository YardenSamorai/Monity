'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Repeat, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  DollarSign,
  Building2,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react'

export function RecurringTransactionsCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [recurringIncomes, setRecurringIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formType, setFormType] = useState('income') // 'income' or 'expense'
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])

  const fetchData = useCallback(async () => {
    try {
      const [recurringTxRes, recurringIncomeRes, accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/recurring-transactions?householdId=' + household?.id, { cache: 'no-store' }),
        fetch('/api/recurring-income?householdId=' + household?.id, { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
      ])

      if (recurringTxRes.ok) {
        const data = await recurringTxRes.json()
        setRecurringTransactions(data.recurringTransactions || [])
      }

      if (recurringIncomeRes.ok) {
        const data = await recurringIncomeRes.json()
        setRecurringIncomes(data.recurringIncomes || [])
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [household?.id])

  useEffect(() => {
    if (household?.id) {
      fetchData()
    }
  }, [household?.id, fetchData])

  // Real-time updates
  useDataRefresh({
    key: 'family-recurring-transactions',
    fetchFn: fetchData,
    events: [
      EVENTS.DASHBOARD_UPDATE,
      EVENTS.TRANSACTION_CREATED,
    ],
  })

  const handleDelete = async (id, type) => {
    if (!confirm(t('family.confirmDeleteRecurring'))) return

    try {
      const endpoint = type === 'income' 
        ? `/api/recurring-income/${id}`
        : `/api/recurring-transactions/${id}`
      
      const response = await fetch(endpoint, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success(t('family.recurringDeleted'))
      fetchData()
    } catch (error) {
      toast.error(t('family.deleteFailed'), error.message)
    }
  }

  const handleToggleActive = async (id, type, isActive) => {
    try {
      const endpoint = type === 'income'
        ? `/api/recurring-income/${id}`
        : `/api/recurring-transactions/${id}`
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      toast.success(t('family.recurringUpdated'))
      fetchData()
    } catch (error) {
      toast.error(t('family.updateFailed'), error.message)
    }
  }

  const allRecurring = [
    ...recurringIncomes.map(ri => ({ ...ri, type: 'income', recurringType: 'income' })),
    ...recurringTransactions.map(rt => ({ ...rt, recurringType: 'transaction' })),
  ].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-6 w-40 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                {t('family.recurringTransactions')}
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingItem(null)
                setFormType('income')
                setIsModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4 me-1" />
              {t('family.addRecurring')}
            </Button>
          </div>
        </div>

        {/* List */}
        {allRecurring.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
              <Repeat className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">
              {t('family.noRecurringTransactions')}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('family.addRecurringHint')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border-primary))]">
            {allRecurring.map((item) => {
              const isExpense = item.type === 'expense' || item.recurringType === 'transaction' && item.type === 'expense'
              const isIncome = item.type === 'income' || item.recurringType === 'income'
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                    !item.isActive && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isIncome 
                        ? "bg-emerald-50 dark:bg-emerald-900/20" 
                        : "bg-rose-50 dark:bg-rose-900/20"
                    )}>
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
                          {item.description}
                        </p>
                        {!item.isActive && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {t('common.paused')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-tertiary))]">
                        <Calendar className="w-3 h-3" />
                        <span>{t('family.dayOfMonth', { day: item.dayOfMonth })}</span>
                        {item.category && (
                          <>
                            <span>•</span>
                            <span>{item.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-end me-2">
                      <p className={cn(
                        "text-sm font-semibold",
                        isIncome 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-rose-600 dark:text-rose-400"
                      )}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(item.amount, { locale: localeString, symbol: currencySymbol })}
                      </p>
                      {item.nextRunDate && (
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                          {new Date(item.nextRunDate).toLocaleDateString(localeString, { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(item.id, item.recurringType === 'income' ? 'income' : 'transaction', item.isActive)}
                        className="p-1.5 hover:bg-[rgb(var(--bg-quaternary))] rounded transition-colors"
                        title={item.isActive ? t('common.pause') : t('common.resume')}
                      >
                        {item.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setFormType(item.recurringType === 'income' ? 'income' : item.type)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 hover:bg-[rgb(var(--bg-quaternary))] rounded transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.recurringType === 'income' ? 'income' : 'transaction')}
                        className="p-1.5 hover:bg-[rgb(var(--bg-quaternary))] rounded transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        onSuccess={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          fetchData()
        }}
        editingItem={editingItem}
        formType={formType}
        setFormType={setFormType}
        household={household}
        accounts={accounts}
        categories={categories}
      />
    </>
  )
}

// Modal Component
function RecurringTransactionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingItem, 
  formType, 
  setFormType,
  household,
  accounts,
  categories 
}) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: formType === 'income' ? 'income' : 'expense',
    amount: '',
    description: '',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    dayOfMonth: '',
    endDate: '',
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        type: editingItem.type || (editingItem.recurringType === 'income' ? 'income' : 'expense'),
        amount: editingItem.amount?.toString() || '',
        description: editingItem.description || '',
        accountId: editingItem.accountId || accounts[0]?.id || '',
        categoryId: editingItem.categoryId || '',
        dayOfMonth: editingItem.dayOfMonth?.toString() || '',
        endDate: editingItem.endDate ? new Date(editingItem.endDate).toISOString().split('T')[0] : '',
      })
      setFormType(editingItem.recurringType === 'income' ? 'income' : editingItem.type)
    } else {
      setFormData({
        type: formType === 'income' ? 'income' : 'expense',
        amount: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: '',
        dayOfMonth: '',
        endDate: '',
      })
    }
  }, [editingItem, formType, accounts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
        householdId: household?.id,
        isShared: true,
        categoryId: formData.categoryId || null,
        endDate: formData.endDate || null,
      }

      const endpoint = formType === 'income'
        ? editingItem
          ? `/api/recurring-income/${editingItem.id}`
          : '/api/recurring-income'
        : editingItem
          ? `/api/recurring-transactions/${editingItem.id}`
          : '/api/recurring-transactions'

      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      toast.success(editingItem ? t('family.recurringUpdated') : t('family.recurringCreated'))
      onSuccess()
    } catch (error) {
      toast.error(t('family.saveFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? t('family.editRecurring') : t('family.addRecurring')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        {!editingItem && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {t('transactions.type')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormType('income')
                  setFormData({ ...formData, type: 'income' })
                }}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  formType === 'income'
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]"
                )}
              >
                <ArrowUpRight className={cn(
                  "w-5 h-5",
                  formType === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-[rgb(var(--text-tertiary))]"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  formType === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-[rgb(var(--text-secondary))]"
                )}>
                  {t('transactions.income')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormType('expense')
                  setFormData({ ...formData, type: 'expense' })
                }}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  formType === 'expense'
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                    : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]"
                )}
              >
                <ArrowDownRight className={cn(
                  "w-5 h-5",
                  formType === 'expense' ? "text-rose-600 dark:text-rose-400" : "text-[rgb(var(--text-tertiary))]"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  formType === 'expense' ? "text-rose-600 dark:text-rose-400" : "text-[rgb(var(--text-secondary))]"
                )}>
                  {t('transactions.expense')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <Input
          label={t('transactions.description')}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('transactions.descriptionPlaceholder')}
          required
        />

        {/* Amount */}
        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />

        {/* Account */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('transactions.account')}
          </label>
          <select
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
            required
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('transactions.category')} ({t('common.optional')})
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
          >
            <option value="">{t('transactions.noCategory')}</option>
            {categories
              .filter(cat => formType === 'income' ? cat.type === 'income' : cat.type === 'expense')
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Day of Month */}
        <Input
          label={t('family.dayOfMonth')}
          type="number"
          min="1"
          max="28"
          value={formData.dayOfMonth}
          onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
          placeholder="1-28"
          required
        />

        {/* End Date (optional) */}
        {formType === 'expense' && (
          <Input
            label={t('family.endDate')} + ' (' + t('common.optional') + ')'
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        )}

        {/* Buttons */}
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
            {loading ? t('common.loading') : (editingItem ? t('common.save') : t('common.add'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
