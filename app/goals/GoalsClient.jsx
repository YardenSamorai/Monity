'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalCard } from './GoalCard'
import { CreateGoalModal } from './CreateGoalModal'
import { AddMoneyModal } from './AddMoneyModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { Target, Plus, PiggyBank } from 'lucide-react'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'

export function GoalsClient({ initialGoals = [], accounts = [], creditCards = [] }) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const [goals, setGoals] = useState(initialGoals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)
  const [expandedForecastGoal, setExpandedForecastGoal] = useState(null)

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }, [])

  // Real-time updates
  useDataRefresh({
    key: 'goals-page',
    fetchFn: fetchGoals,
    events: [
      EVENTS.GOAL_CREATED,
      EVENTS.GOAL_UPDATED,
      EVENTS.GOAL_DELETED,
      EVENTS.GOAL_CONTRIBUTION,
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  // Calculate KPIs
  const activeGoals = goals.filter(g => !g.isPaused)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
  
  const nearestGoal = useMemo(() => {
    if (goals.length === 0) return null
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: (goal.savedAmount / goal.targetAmount) * 100,
    }))
    return goalsWithProgress.reduce((nearest, current) => {
      if (current.progress > nearest.progress) return current
      return nearest
    })
  }, [goals])

  const handleCreateGoal = async (goalData) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create goal')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error creating goal:', error)
      throw error
    }
  }

  const handleAddMoney = async (goalId, amount, date, note, paymentMethod, sourceId) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          date, 
          note,
          paymentMethod,
          sourceId, // accountId or creditCardId
        }),
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add money')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error adding money:', error)
      throw error
    }
  }

  const handleEditGoal = async (goalId, updates) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update goal')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return
    try {
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        // If goal not found, just refresh to get current state
        if (response.status === 404) {
          console.log('Goal not found, refreshing...')
          await fetchGoals()
          return
        }
        throw new Error(error.error || 'Failed to delete goal')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
      // Refresh anyway to sync with server state
      await fetchGoals()
    }
  }

  const handleTogglePause = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !goal.isPaused }),
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update goal')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error toggling pause:', error)
      throw error
    }
  }

  const handleMarkCompleted = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: goal.targetAmount, isCompleted: true }),
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete goal')
      }
      await fetchGoals()
    } catch (error) {
      console.error('Error completing goal:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
                {t('goals.title')}
              </h1>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                {t('goals.subtitle')}
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex">
              <Plus className="w-4 h-4" />
              {t('goals.createGoal')}
            </Button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">{t('goals.activeGoals')}</div>
            <div className="text-2xl font-semibold text-[rgb(var(--text-primary))]">{activeGoals.length}</div>
            <div className="text-xs text-[rgb(var(--text-tertiary))]">{t('goals.outOf', { total: goals.length })}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">{t('goals.totalTarget')}</div>
            <div className="text-xl font-semibold text-[rgb(var(--text-primary))] tabular-nums" dir="ltr">
              {formatCurrency(totalTarget, { locale: localeString, symbol: currencySymbol })}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">{t('goals.totalSaved')}</div>
            <div className="text-xl font-semibold text-positive tabular-nums" dir="ltr">
              {formatCurrency(totalSaved, { locale: localeString, symbol: currencySymbol })}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">{t('goals.progress')}</div>
            <div className="text-xl font-semibold text-[rgb(var(--accent))]">
              {overallProgress.toFixed(0)}%
            </div>
            <div className="progress-track mt-2">
              <div 
                className="progress-fill bg-[rgb(var(--accent))]"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<PiggyBank className="w-6 h-6" />}
              title={t('goals.noGoals')}
              description={t('goals.startSaving')}
              action={() => setIsCreateModalOpen(true)}
              actionLabel={t('goals.createGoal')}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddMoney={() => {
                  setSelectedGoal(goal)
                  setIsAddMoneyModalOpen(true)
                }}
                onEdit={(updates) => handleEditGoal(goal.id, updates)}
                onDelete={() => {
                  setGoalToDelete(goal)
                  setIsDeleteDialogOpen(true)
                }}
                onTogglePause={() => handleTogglePause(goal.id)}
                onMarkCompleted={() => handleMarkCompleted(goal.id)}
                onForecastToggle={() => {
                  setExpandedForecastGoal(expandedForecastGoal === goal.id ? null : goal.id)
                }}
                isForecastExpanded={expandedForecastGoal === goal.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
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
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGoal}
      />

      {selectedGoal && (
        <AddMoneyModal
          isOpen={isAddMoneyModalOpen}
          onClose={() => { setIsAddMoneyModalOpen(false); setSelectedGoal(null) }}
          goal={selectedGoal}
          onAdd={handleAddMoney}
          accounts={accounts}
          creditCards={creditCards}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setGoalToDelete(null) }}
        title={t('goals.deleteGoal')}
        message={t('goals.deleteConfirm', { name: goalToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteGoal}
        variant="danger"
      />
    </div>
  )
}
