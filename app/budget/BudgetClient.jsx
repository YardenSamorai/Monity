'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { BudgetModal } from '@/components/forms/BudgetModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, cn } from '@/lib/utils'
import { Target, Plus, Edit, Trash2, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'

export function BudgetClient({ initialBudgets, categories, totalBudget: initialTotalBudget, totalActual: initialTotalActual, month, year, currentDate }) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [budgets, setBudgets] = useState(initialBudgets)
  const [totalBudget, setTotalBudget] = useState(initialTotalBudget)
  const [totalActual, setTotalActual] = useState(initialTotalActual)
  const [editingBudget, setEditingBudget] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState(null)

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setBudgets(data.budgets || [])
        setTotalBudget(data.totalBudget || 0)
        setTotalActual(data.totalActual || 0)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }, [month, year])

  // Real-time updates
  useDataRefresh({
    key: 'budget-page',
    fetchFn: fetchBudgets,
    events: [
      EVENTS.BUDGET_CREATED,
      EVENTS.BUDGET_UPDATED,
      EVENTS.BUDGET_DELETED,
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const handleSuccess = async () => {
    await fetchBudgets()
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setIsModalOpen(true)
  }

  const handleDelete = (budget) => {
    setBudgetToDelete(budget)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return

    try {
      const response = await fetch(`/api/budgets/${budgetToDelete.id}`, {
        method: 'DELETE',
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('budget.deleteFailed'))
      }

      toast.success(t('budget.deleted'), t('budget.deletedSuccess'))
      setBudgets(budgets.filter(b => b.id !== budgetToDelete.id))
      await fetchBudgets()
      setBudgetToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error(t('budget.deleteFailed'), error.message)
    }
  }

  const remaining = totalBudget - totalActual
  const percentageSpent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  const getStatusColor = (percentage) => {
    if (percentage > 100) return { text: 'text-negative', bg: 'bg-[rgb(var(--negative))]' }
    if (percentage > 80) return { text: 'text-warning', bg: 'bg-[rgb(var(--warning))]' }
    return { text: 'text-positive', bg: 'bg-[rgb(var(--positive))]' }
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="px-4 py-4 pb-24">
        
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('budget.title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {new Date(currentDate).toLocaleDateString(localeString, { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Summary Grid - 3 columns on mobile */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {/* Total Budget */}
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-1">{t('budget.total')}</p>
            <p className="text-base font-bold tabular-nums text-[rgb(var(--text-primary))]" dir="ltr">
              {currencySymbol}{totalBudget.toLocaleString()}
            </p>
          </div>
          
          {/* Spent */}
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-1">{t('budget.spent')}</p>
            <p className="text-base font-bold tabular-nums text-negative" dir="ltr">
              {currencySymbol}{totalActual.toLocaleString()}
            </p>
            {totalBudget > 0 && (
              <p className="text-[9px] text-[rgb(var(--text-tertiary))]">
                {percentageSpent.toFixed(0)}% {t('budget.ofBudget')}
              </p>
            )}
          </div>
          
          {/* Remaining */}
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-1">{t('budget.remaining')}</p>
            <p className={cn(
              "text-base font-bold tabular-nums",
              remaining >= 0 ? "text-positive" : "text-negative"
            )} dir="ltr">
              {currencySymbol}{Math.abs(remaining).toLocaleString()}
            </p>
            <p className="text-[9px] text-[rgb(var(--text-tertiary))]">
              {remaining >= 0 ? t('budget.leftToSpend') : t('budget.over')}
            </p>
          </div>
        </div>

        {/* Overall Progress - only show if there are budgets */}
        {totalBudget > 0 && (
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">{t('budget.overallProgress')}</span>
              <span className={cn('text-xs font-bold', getStatusColor(percentageSpent).text)}>
                {percentageSpent.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all duration-300', getStatusColor(percentageSpent).bg)}
                style={{ width: `${Math.min(percentageSpent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t('budget.byCategory')}
          </h2>
          <Button size="sm" onClick={() => { setEditingBudget(null); setIsModalOpen(true) }}>
            <Plus className="w-4 h-4" />
            <span>{t('budget.createBudget')}</span>
          </Button>
        </div>

        {/* Budgets List or Empty State */}
        {budgets.length === 0 ? (
          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
                <Target className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
              </div>
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-1">
                {t('budget.noBudgets')}
              </h3>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mb-4 max-w-[200px] mx-auto">
                {t('budget.startPlanning')}
              </p>
              <Button size="sm" onClick={() => { setEditingBudget(null); setIsModalOpen(true) }}>
                <Plus className="w-4 h-4" />
                <span>{t('budget.createBudget')}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {budgets.map((budget) => {
              const budgetAmount = Number(budget.amount)
              const actualAmount = budget.actual
              const budgetRemaining = budgetAmount - actualAmount
              const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0
              const colors = getStatusColor(percentage)
              
              return (
                <div 
                  key={budget.id} 
                  className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3"
                >
                  {/* Top Row: Category + Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {budget.category?.icon && (
                        <span className="text-base">{budget.category.icon}</span>
                      )}
                      <span className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                        {budget.category?.name || t('transactions.uncategorized')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-1.5 rounded text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] active:bg-[rgb(var(--bg-tertiary))]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget)}
                        className="p-1.5 rounded text-[rgb(var(--text-tertiary))] hover:text-negative active:text-negative"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-1.5 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn('h-full rounded-full transition-all duration-300', colors.bg)}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  
                  {/* Bottom Row: Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[rgb(var(--text-tertiary))]">
                      <span dir="ltr">{currencySymbol}{actualAmount.toLocaleString()}</span>
                      {' / '}
                      <span dir="ltr">{currencySymbol}{budgetAmount.toLocaleString()}</span>
                    </span>
                    <span className={cn('font-medium', colors.text)}>
                      {budgetRemaining >= 0 
                        ? `${t('budget.remaining')}: ${currencySymbol}${budgetRemaining.toLocaleString()}`
                        : `${t('budget.over')}: ${currencySymbol}${Math.abs(budgetRemaining).toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingBudget(null); setIsModalOpen(true) }}
        className={cn(
          "fixed bottom-20 z-40 w-12 h-12 rounded-full",
          "bg-[rgb(var(--accent))] text-white shadow-lg",
          "flex items-center justify-center",
          "hover:opacity-90 active:scale-95 transition-all",
          isRTL ? "left-4" : "right-4"
        )}
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Modals */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBudget(null) }}
        categories={categories}
        month={month}
        year={year}
        onSuccess={handleSuccess}
        editingBudget={editingBudget}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title={t('budget.deleteBudget')}
        message={t('budget.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  )
}
