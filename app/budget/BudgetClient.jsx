'use client'

import { useState } from 'react'
import { Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { BudgetModal } from '@/components/forms/BudgetModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { Target, Plus, TrendingDown, TrendingUp, Edit, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'

export function BudgetClient({ initialBudgets, categories, totalBudget, totalActual, month, year, currentDate }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [budgets, setBudgets] = useState(initialBudgets)
  const [editingBudget, setEditingBudget] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState(null)

  const handleSuccess = async () => {
    // Refresh budgets
    window.location.reload()
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('budget.deleteFailed'))
      }

      toast.success(t('budget.deleted'), t('budget.deletedSuccess'))
      
      // Remove from local state
      setBudgets(budgets.filter(b => b.id !== budgetToDelete.id))
      
      // Reload to update totals
      window.location.reload()
      
      setBudgetToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error(t('budget.deleteFailed'), error.message)
    }
  }

  const remaining = totalBudget - totalActual
  const percentageSpent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">
          {t('budget.title')}
        </h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {new Date(currentDate).toLocaleDateString(localeString, { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t('budget.total')}
          value={formatCurrency(totalBudget, { locale: localeString, symbol: currencySymbol })}
          icon={<Target className="w-5 h-5" />}
        />
        
        <StatCard
          title={t('budget.spent')}
          value={formatCurrency(totalActual, { locale: localeString, symbol: currencySymbol })}
          subtitle={t('budget.percentageOfBudget', { percentage: percentageSpent.toFixed(0) })}
          icon={<TrendingDown className="w-5 h-5" />}
        />
        
        <StatCard
          title={t('budget.remaining')}
          value={formatCurrency(Math.abs(remaining), { locale: localeString, symbol: currencySymbol })}
          subtitle={remaining < 0 ? t('budget.over') : t('budget.leftToSpend')}
          icon={remaining >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        />
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {t('budget.overallProgress')}
              </h3>
              <span className={`font-semibold ${
                percentageSpent > 100 ? 'text-light-danger dark:text-dark-danger' :
                percentageSpent > 80 ? 'text-light-warning dark:text-dark-warning' :
                'text-light-success dark:text-dark-success'
              }`}>
                {percentageSpent.toFixed(0)}%
              </span>
            </div>
            <Progress value={totalActual} max={totalBudget} />
          </div>
        </Card>
      )}

      {/* Budget List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            {t('budget.byCategory')}
          </h2>
          <Button size="sm" onClick={() => {
            setEditingBudget(null)
            setIsModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            {t('budget.createBudget')}
          </Button>
        </div>
        
        {budgets.length === 0 ? (
          <EmptyState
            icon={<Target className="w-8 h-8" />}
            title={t('budget.noBudgets')}
            description={t('budget.startPlanning')}
            action={() => {
              setEditingBudget(null)
              setIsModalOpen(true)
            }}
            actionLabel={t('budget.createBudget')}
          />
        ) : (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const budgetAmount = Number(budget.amount)
              const actualAmount = budget.actual
              const remaining = budgetAmount - actualAmount
              const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0
              
              return (
                <div key={budget.id} className="group relative space-y-3 pb-6 border-b border-light-border-light dark:border-dark-border-light last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                        {budget.category?.name || t('transactions.uncategorized')}
                      </div>
                      <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                        {t('budget.spentOf', { 
                          spent: formatCurrency(actualAmount, { locale: localeString, symbol: currencySymbol }),
                          budget: formatCurrency(budgetAmount, { locale: localeString, symbol: currencySymbol })
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          remaining >= 0 
                            ? 'text-light-success dark:text-dark-success' 
                            : 'text-light-danger dark:text-dark-danger'
                        }`}>
                          {formatCurrency(Math.abs(remaining), { locale: localeString, symbol: currencySymbol })}
                        </div>
                        <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                          {remaining >= 0 ? t('budget.remaining') : t('budget.over')}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(budget)
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
                            handleDelete(budget)
                          }}
                          className="h-9 w-9 p-0 text-light-danger dark:text-dark-danger hover:text-light-danger-dark dark:hover:text-dark-danger-dark"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={actualAmount} max={budgetAmount} />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-light-text-tertiary dark:text-dark-text-tertiary">
                      {t('budget.percentageUsed', { percentage: percentage.toFixed(0) })}
                    </span>
                    {percentage >= 100 && (
                      <span className="text-light-danger dark:text-dark-danger font-medium">
                        {t('budget.exceeded')}
                      </span>
                    )}
                    {percentage >= 80 && percentage < 100 && (
                      <span className="text-light-warning dark:text-dark-warning font-medium">
                        {t('budget.approaching')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
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
        categories={categories}
        month={month}
        year={year}
        onSuccess={handleSuccess}
        editingBudget={editingBudget}
      />

      {/* Delete Confirmation Dialog */}
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
