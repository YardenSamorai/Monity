'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

export function LinkTransactionModal({ isOpen, onClose, transaction, goals, onSuccess }) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState('')

  useEffect(() => {
    if (transaction?.savingsGoalId) {
      setSelectedGoalId(transaction.savingsGoalId)
    } else {
      setSelectedGoalId('')
    }
  }, [transaction, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedGoalId || !transaction) return

    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savingsGoalId: selectedGoalId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to link transaction')
      }

      toast.success(t('goals.transactionLinked'), t('goals.transactionLinkedSuccess'))
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(t('goals.linkFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!transaction?.savingsGoalId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savingsGoalId: null }),
      })

      if (!response.ok) {
        throw new Error('Failed to unlink transaction')
      }

      toast.success(t('goals.transactionUnlinked'), t('goals.transactionUnlinkedSuccess'))
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(t('goals.unlinkFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  const activeGoals = goals.filter(g => !g.isCompleted && !g.isPaused)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('goals.linkTransaction')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {transaction && (
          <div className="p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
              {t('goals.transaction')}
            </p>
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {transaction.description}
            </p>
          </div>
        )}

        <Select
          label={t('goals.selectGoal')}
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
        >
          <option value="">{t('goals.noGoal')}</option>
          {activeGoals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.icon} {goal.name}
            </option>
          ))}
        </Select>

        <div className="flex gap-3 pt-4">
          {transaction?.savingsGoalId && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleUnlink}
              disabled={loading}
            >
              {t('goals.unlink')}
            </Button>
          )}
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
            disabled={loading || !selectedGoalId}
            loading={loading}
          >
            {t('goals.link')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

