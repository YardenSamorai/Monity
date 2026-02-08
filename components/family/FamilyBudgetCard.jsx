'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  PieChart, 
  Plus, 
  Edit2, 
  Trash2,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

export function FamilyBudgetCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const fetchData = useCallback(async () => {
    try {
      const start = new Date(currentYear, currentMonth - 1, 1)
      const end = new Date(currentYear, currentMonth, 0)

      const [budgetsRes, categoriesRes, transactionsRes, creditCardsRes] = await Promise.all([
        fetch(`/api/budgets?onlyShared=true&month=${currentMonth}&year=${currentYear}`, { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch(`/api/transactions?onlyShared=true&startDate=${start.toISOString()}&endDate=${end.toISOString()}`, { cache: 'no-store' }),
        fetch('/api/credit-cards', { cache: 'no-store' }),
      ])

      const budgetsData = await budgetsRes.json()
      const categoriesData = await categoriesRes.json()
      const transactionsData = await transactionsRes.json()
      const creditCardsData = await creditCardsRes.json()

      // Fetch shared CC transactions
      const allCCExpenses = []
      for (const card of (creditCardsData.creditCards || [])) {
        try {
          const ccRes = await fetch(`/api/credit-cards/${card.id}/transactions`, { cache: 'no-store' })
          const ccData = await ccRes.json()
          const shared = (ccData.transactions || []).filter(tx => {
            const txDate = new Date(tx.date)
            return tx.isShared && tx.householdId === household?.id && txDate >= start && txDate <= end
          })
          allCCExpenses.push(...shared)
        } catch (e) { /* ignore */ }
      }

      // Calculate expenses per category
      const allTransactions = [...(transactionsData.transactions || []), ...allCCExpenses.map(tx => ({ ...tx, type: 'expense' }))]
      const expensesByCategory = {}
      let totalExpenses = 0

      allTransactions
        .filter(tx => tx.type === 'expense')
        .forEach(tx => {
          const catId = tx.categoryId || tx.category?.id || 'total'
          expensesByCategory[catId] = (expensesByCategory[catId] || 0) + Number(tx.amount)
          totalExpenses += Number(tx.amount)
        })
      
      expensesByCategory['total'] = totalExpenses

      setBudgets(budgetsData.budgets || [])
      setCategories(categoriesData.categories || [])
      setExpenses(expensesByCategory)
    } catch (error) {
      console.error('Error fetching budget data:', error)
    } finally {
      setLoading(false)
    }
  }, [household?.id, currentMonth, currentYear])

  useEffect(() => {
    if (household?.id) fetchData()
  }, [household?.id, fetchData])

  useDataRefresh({
    key: 'family-budget',
    fetchFn: fetchData,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.FAMILY_TRANSACTION,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const handleSaveBudget = async (formData) => {
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formData.categoryId || null,
          month: currentMonth,
          year: currentYear,
          amount: parseFloat(formData.amount),
          householdId: household?.id,
          isShared: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to save budget')

      toast.success(t('family.budgetSaved'))
      await fetchData()
      setIsModalOpen(false)
      setEditingBudget(null)
    } catch (error) {
      toast.error(t('family.budgetSaveFailed'), error.message)
    }
  }

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return
    try {
      const response = await fetch(`/api/budgets/${budgetToDelete.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success(t('family.budgetDeleted'))
      await fetchData()
      setBudgetToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('family.budgetDeleteFailed'), error.message)
    }
  }

  // Total budget (no category = overall budget)
  const overallBudget = budgets.find(b => !b.categoryId)
  const categoryBudgets = budgets.filter(b => b.categoryId)
  const totalBudgetAmount = overallBudget ? Number(overallBudget.amount) : 0
  const totalSpent = expenses['total'] || 0
  const overallProgress = totalBudgetAmount > 0 ? Math.min((totalSpent / totalBudgetAmount) * 100, 100) : 0

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-6 w-40 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
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
              <PieChart className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                {t('family.familyBudget')}
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingBudget(null)
                setIsModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4 me-1" />
              {t('family.setBudget')}
            </Button>
          </div>
        </div>

        {/* No budget set */}
        {budgets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
              <PieChart className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">
              {t('family.noBudgetSet')}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('family.setBudgetHint')}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Overall Budget */}
            {overallBudget && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {t('family.totalBudget')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      overallProgress >= 90 ? "text-rose-600 dark:text-rose-400" :
                      overallProgress >= 70 ? "text-amber-600 dark:text-amber-400" :
                      "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {overallProgress.toFixed(0)}%
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBudget(overallBudget)
                          setIsModalOpen(true)
                        }}
                        className="p-1 hover:bg-[rgb(var(--bg-tertiary))] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                      </button>
                      <button
                        onClick={() => {
                          setBudgetToDelete(overallBudget)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="p-1 hover:bg-[rgb(var(--bg-tertiary))] rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-3 rounded-full bg-[rgb(var(--bg-tertiary))] overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      overallProgress >= 90 ? "bg-rose-500" :
                      overallProgress >= 70 ? "bg-amber-500" :
                      "bg-emerald-500"
                    )}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
                  <span>
                    {t('family.spent')}: {formatCurrency(totalSpent, { locale: localeString, symbol: currencySymbol })}
                  </span>
                  <span>
                    {t('family.of')} {formatCurrency(totalBudgetAmount, { locale: localeString, symbol: currencySymbol })}
                  </span>
                </div>

                {/* Status */}
                {overallProgress >= 90 && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('family.budgetAlmostExceeded')}
                  </div>
                )}
                {totalBudgetAmount > 0 && totalSpent <= totalBudgetAmount * 0.5 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('family.budgetOnTrack')}
                  </div>
                )}
              </div>
            )}

            {/* Category Budgets */}
            {categoryBudgets.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[rgb(var(--border-primary))]">
                <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
                  {t('family.categoryBudgets')}
                </span>
                {categoryBudgets.map(budget => {
                  const catExpenses = expenses[budget.categoryId] || 0
                  const catProgress = Number(budget.amount) > 0 
                    ? Math.min((catExpenses / Number(budget.amount)) * 100, 100) 
                    : 0

                  return (
                    <div key={budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {budget.category?.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: budget.category.color }}
                            />
                          )}
                          <span className="text-sm text-[rgb(var(--text-primary))]">
                            {budget.category?.name || t('transactions.uncategorized')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[rgb(var(--text-tertiary))]">
                            {formatCurrency(catExpenses, { locale: localeString, symbol: currencySymbol })} / {formatCurrency(budget.amount, { locale: localeString, symbol: currencySymbol })}
                          </span>
                          <button
                            onClick={() => {
                              setEditingBudget(budget)
                              setIsModalOpen(true)
                            }}
                            className="p-1 hover:bg-[rgb(var(--bg-tertiary))] rounded"
                          >
                            <Edit2 className="w-3 h-3 text-[rgb(var(--text-tertiary))]" />
                          </button>
                          <button
                            onClick={() => {
                              setBudgetToDelete(budget)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="p-1 hover:bg-[rgb(var(--bg-tertiary))] rounded"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgb(var(--bg-tertiary))] overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            catProgress >= 90 ? "bg-rose-500" :
                            catProgress >= 70 ? "bg-amber-500" :
                            "bg-blue-500"
                          )}
                          style={{ width: `${catProgress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBudget(null)
        }}
        onSave={handleSaveBudget}
        editingBudget={editingBudget}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setBudgetToDelete(null)
        }}
        title={t('family.deleteBudget')}
        message={t('family.deleteBudgetConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteBudget}
        variant="danger"
      />
    </>
  )
}

// Budget Modal
function BudgetModal({ isOpen, onClose, onSave, editingBudget, categories }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
  })

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        categoryId: editingBudget.categoryId || '',
        amount: String(Number(editingBudget.amount)),
      })
    } else {
      setFormData({ categoryId: '', amount: '' })
    }
  }, [editingBudget, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) return

    setLoading(true)
    try {
      await onSave({
        categoryId: formData.categoryId || null,
        amount: formData.amount,
      })
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? t('family.editBudget') : t('family.setBudget')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('family.budgetCategory')}
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
            disabled={!!editingBudget}
          >
            <option value="">{t('family.totalBudgetOption')}</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {formData.categoryId ? t('family.categoryBudgetDesc') : t('family.totalBudgetDesc')}
          </p>
        </div>

        {/* Amount */}
        <Input
          label={t('family.budgetAmount')}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />

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
            disabled={loading || !formData.amount}
          >
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
