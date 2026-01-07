'use client'

import { useState, useMemo } from 'react'
import { Card, KPICard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalCard } from './GoalCard'
import { CreateGoalModal } from './CreateGoalModal'
import { AddMoneyModal } from './AddMoneyModal'
import { ForecastPanel } from './ForecastPanel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'

export function GoalsClient({ initialGoals = [] }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [goals, setGoals] = useState(initialGoals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)
  const [expandedForecastGoal, setExpandedForecastGoal] = useState(null)

  // Calculate KPIs
  const activeGoals = goals.filter(g => !g.isPaused)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0)
  
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create goal')
      }

      const { goal } = await response.json()
      window.location.reload() // Reload to get fresh data
    } catch (error) {
      console.error('Error creating goal:', error)
      // Error handling will be done in CreateGoalModal
      throw error
    }
  }

  const handleAddMoney = async (goalId, amount, date, note) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, date, note }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add money')
      }

      window.location.reload() // Reload to get fresh data
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update goal')
      }

      window.location.reload()
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete goal')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  const handleTogglePause = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !goal.isPaused }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update goal')
      }

      window.location.reload()
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete goal')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error completing goal:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {t('goals.title')}
            </h1>
          </div>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            {t('goals.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('goals.createGoal')}
        </Button>
      </div>

      {/* KPIs Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <KPICard
          title={t('goals.activeGoals')}
          value={activeGoals.length}
          subtitle={t('goals.outOf', { total: goals.length })}
          icon={<Target className="w-5 h-5" />}
          variant="balance"
        />
        
        <KPICard
          title={t('goals.totalTarget')}
          value={formatCurrency(totalTarget, { locale: localeString, symbol: currencySymbol })}
          subtitle={t('goals.acrossAllGoals')}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="income"
        />
        
        <KPICard
          title={t('goals.totalSaved')}
          value={formatCurrency(totalSaved, { locale: localeString, symbol: currencySymbol })}
          subtitle={`${((totalSaved / totalTarget) * 100).toFixed(0)}% ${t('goals.complete')}`}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="net"
        />
        
        <KPICard
          title={t('goals.nearestGoal')}
          value={nearestGoal ? nearestGoal.name : '-'}
          subtitle={nearestGoal ? `${nearestGoal.progress.toFixed(0)}% ${t('goals.complete')}` : t('goals.noGoals')}
          icon={<Calendar className="w-5 h-5" />}
          variant="netNegative"
        />
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target className="w-12 h-12" />}
            title={t('goals.noGoals')}
            description={t('goals.startSaving')}
            action={() => setIsCreateModalOpen(true)}
            actionLabel={t('goals.createGoal')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGoal}
      />

      {/* Add Money Modal */}
      {selectedGoal && (
        <AddMoneyModal
          isOpen={isAddMoneyModalOpen}
          onClose={() => {
            setIsAddMoneyModalOpen(false)
            setSelectedGoal(null)
          }}
          goal={selectedGoal}
          onAdd={handleAddMoney}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setGoalToDelete(null)
        }}
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

