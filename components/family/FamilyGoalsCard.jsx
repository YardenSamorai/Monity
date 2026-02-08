'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  Pause, 
  Play,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'

const EMOJI_OPTIONS = ['🎯', '✈️', '🏠', '💻', '🚗', '🎓', '💍', '🏖️', '🛡️', '💰', '🎁', '📱']

export function FamilyGoalsCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [goals, setGoals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [goalToDelete, setGoalToDelete] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [goalsRes, accountsRes, creditCardsRes] = await Promise.all([
        fetch(`/api/goals?householdId=${household?.id}&onlyShared=true`, { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' }),
        fetch('/api/credit-cards', { cache: 'no-store' }),
      ])

      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data.goals || [])
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }

      if (creditCardsRes.ok) {
        const data = await creditCardsRes.json()
        setCreditCards(data.creditCards || [])
      }
    } catch (error) {
      console.error('Error fetching family goals:', error)
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
    key: 'family-goals',
    fetchFn: fetchData,
    events: [
      EVENTS.GOAL_CREATED,
      EVENTS.GOAL_UPDATED,
      EVENTS.GOAL_DELETED,
      EVENTS.GOAL_CONTRIBUTION,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const handleCreateGoal = async (goalData) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goalData,
          householdId: household?.id,
          isShared: true,
        }),
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create goal')
      }

      toast.success(t('family.goalCreated'))
      await fetchData()
      setIsCreateModalOpen(false)
    } catch (error) {
      toast.error(t('family.goalCreateFailed'), error.message)
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
          sourceId,
        }),
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add money')
      }

      toast.success(t('family.moneyAddedToGoal'))
      await fetchData()
      setIsAddMoneyModalOpen(false)
      setSelectedGoal(null)
    } catch (error) {
      toast.error(t('family.addMoneyFailed'), error.message)
    }
  }

  const handleDelete = async () => {
    if (!goalToDelete) return

    try {
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success(t('family.goalDeleted'))
      setGoals(goals.filter(g => g.id !== goalToDelete.id))
      setGoalToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(t('family.goalDeleteFailed'), error.message)
    }
  }

  const handleTogglePause = async (goal) => {
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !goal.isPaused }),
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      toast.success(t('family.goalUpdated'))
      await fetchData()
    } catch (error) {
      toast.error(t('family.goalUpdateFailed'), error.message)
    }
  }

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-6 w-40 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
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
              <Target className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                {t('family.familyGoals')}
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 me-1" />
              {t('family.addGoal')}
            </Button>
          </div>
        </div>

        {/* List */}
        {goals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
              <Target className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">
              {t('family.noFamilyGoals')}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('family.addGoalHint')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border-primary))]">
            {goals.map((goal) => {
              const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
              const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
              const isCompleted = progress >= 100
              const daysUntilTarget = goal.targetDate 
                ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <div
                  key={goal.id}
                  className={cn(
                    "p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                    goal.isPaused && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-2xl">
                      {goal.icon || '🎯'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-[rgb(var(--text-primary))]">
                          {goal.name}
                        </h4>
                        {goal.isPaused && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {t('goals.paused')}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {t('goals.completed')}
                          </span>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[rgb(var(--text-tertiary))]">
                            {formatCurrency(goal.currentAmount, { locale: localeString, symbol: currencySymbol })} / {formatCurrency(goal.targetAmount, { locale: localeString, symbol: currencySymbol })}
                          </span>
                          <span className={cn(
                            "text-xs font-semibold",
                            isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                          )}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="progress-track h-1.5">
                          <div 
                            className={cn(
                              "progress-fill h-full",
                              isCompleted ? "bg-emerald-500" : "bg-blue-500"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-tertiary))]">
                        {goal.targetDate && (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(goal.targetDate).toLocaleDateString(localeString)}</span>
                            {daysUntilTarget !== null && daysUntilTarget > 0 && (
                              <span>• {daysUntilTarget} {t('goals.daysLeft')}</span>
                            )}
                          </>
                        )}
                        {!isCompleted && remaining > 0 && (
                          <>
                            {goal.targetDate && <span>•</span>}
                            <span>{t('goals.remaining')}: {formatCurrency(remaining, { locale: localeString, symbol: currencySymbol })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setSelectedGoal(goal)
                            setIsAddMoneyModalOpen(true)
                          }}
                          className="p-1.5 hover:bg-[rgb(var(--bg-quaternary))] rounded transition-colors"
                          title={t('goals.addMoney')}
                        >
                          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleTogglePause(goal)}
                        className="p-1.5 hover:bg-[rgb(var(--bg-quaternary))] rounded transition-colors"
                        title={goal.isPaused ? t('goals.resume') : t('goals.pause')}
                      >
                        {goal.isPaused ? (
                          <Play className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                        ) : (
                          <Pause className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setGoalToDelete(goal)
                          setIsDeleteDialogOpen(true)
                        }}
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

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGoal}
      />

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyModalOpen}
        onClose={() => {
          setIsAddMoneyModalOpen(false)
          setSelectedGoal(null)
        }}
        goal={selectedGoal}
        accounts={accounts}
        creditCards={creditCards}
        onAdd={handleAddMoney}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setGoalToDelete(null)
        }}
        title={t('family.deleteGoal')}
        message={t('family.deleteGoalConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  )
}

// Create Goal Modal Component
function CreateGoalModal({ isOpen, onClose, onCreate }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '🎯',
    targetAmount: '',
    targetDate: '',
    initialSavedAmount: '0',
    priority: 'medium',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onCreate({
        name: formData.name.trim(),
        icon: formData.icon,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate || null,
        initialSavedAmount: parseFloat(formData.initialSavedAmount) || 0,
        priority: formData.priority,
      })
    } catch (error) {
      // Error already handled in parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('family.addGoal')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon Selector */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('goals.icon')}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className={cn(
                  "p-3 rounded-xl border text-2xl transition-all",
                  formData.icon === emoji
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input
          label={t('goals.name')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('goals.namePlaceholder')}
          required
        />

        {/* Target Amount */}
        <Input
          label={t('goals.targetAmount')}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.targetAmount}
          onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          placeholder="0.00"
          required
        />

        {/* Target Date */}
        <Input
          label={`${t('goals.targetDate')} (${t('common.optional')})`}
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        />

        {/* Initial Saved Amount */}
        <Input
          label={`${t('goals.initialSavedAmount')} (${t('common.optional')})`}
          type="number"
          step="0.01"
          min="0"
          value={formData.initialSavedAmount}
          onChange={(e) => setFormData({ ...formData, initialSavedAmount: e.target.value })}
          placeholder="0.00"
        />

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('goals.priority')}
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
          >
            <option value="low">{t('goals.priorityLow')}</option>
            <option value="medium">{t('goals.priorityMedium')}</option>
            <option value="high">{t('goals.priorityHigh')}</option>
          </select>
        </div>

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
            {loading ? t('common.loading') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Add Money Modal Component
function AddMoneyModal({ isOpen, onClose, goal, accounts, creditCards, onAdd }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'account',
    sourceId: accounts[0]?.id || '',
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'account',
        sourceId: accounts[0]?.id || '',
      })
    }
  }, [goal, accounts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!goal) return

    setLoading(true)
    try {
      await onAdd(
        goal.id,
        parseFloat(formData.amount),
        formData.date,
        formData.note,
        formData.paymentMethod,
        formData.sourceId
      )
    } catch (error) {
      // Error already handled in parent
    } finally {
      setLoading(false)
    }
  }

  if (!goal) return null

  const allPaymentSources = [
    ...accounts.map(acc => ({ id: acc.id, name: acc.name, type: 'account' })),
    ...creditCards.map(card => ({ 
      id: card.id, 
      name: `${card.name} •••• ${card.lastFourDigits || '****'}`,
      type: 'credit'
    })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('goals.addMoney')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Info */}
        <div className="p-3 rounded-xl bg-[rgb(var(--bg-tertiary))]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{goal.icon || '🎯'}</span>
            <span className="font-medium text-sm">{goal.name}</span>
          </div>
          <div className="text-xs text-[rgb(var(--text-tertiary))]">
            {formatCurrency(goal.currentAmount, { locale: localeString, symbol: currencySymbol })} / {formatCurrency(goal.targetAmount, { locale: localeString, symbol: currencySymbol })}
          </div>
        </div>

        {/* Amount */}
        <Input
          label={t('goals.amount')}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />

        {/* Date */}
        <Input
          label={t('goals.date')}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        {/* Payment Method */}
        <div>
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
            {t('goals.paymentMethod')}
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                paymentMethod: e.target.value,
                sourceId: e.target.value === 'account' 
                  ? (accounts[0]?.id || '')
                  : (creditCards[0]?.id || '')
              })
            }}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
            required
          >
            <option value="account">{t('transactions.paymentMethods.account')}</option>
            <option value="credit">{t('transactions.paymentMethods.creditCard')}</option>
            <option value="cash">{t('transactions.paymentMethods.cash')}</option>
          </select>
        </div>

        {/* Source */}
        {formData.paymentMethod !== 'cash' && (
          <div>
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2 block">
              {formData.paymentMethod === 'account' ? t('transactions.account') : t('transactions.creditCard')}
            </label>
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              required
            >
              {formData.paymentMethod === 'account' 
                ? accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))
                : creditCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.name} •••• {card.lastFourDigits || '****'}
                    </option>
                  ))
              }
            </select>
          </div>
        )}

        {/* Note */}
        <Input
          label={`${t('goals.note')} (${t('common.optional')})`}
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder={t('goals.notePlaceholder')}
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
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
