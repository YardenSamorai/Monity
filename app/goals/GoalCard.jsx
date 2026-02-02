'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { Plus, Pause, Play, Trash2, Calendar, CheckCircle } from 'lucide-react'

export function GoalCard({ 
  goal, 
  onAddMoney, 
  onDelete, 
  onTogglePause, 
  onMarkCompleted,
}) {
  const { t, currencySymbol, localeString } = useI18n()
  
  const progress = (goal.savedAmount / goal.targetAmount) * 100
  const remaining = goal.targetAmount - goal.savedAmount
  const isCompleted = progress >= 100

  const daysUntilTarget = goal.targetDate 
    ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="p-5 group" hover>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[rgb(var(--text-primary))] truncate">
              {goal.name}
            </h3>
            {goal.isPaused && (
              <Badge variant="warning" size="xs">{t('goals.paused')}</Badge>
            )}
            {isCompleted && (
              <Badge variant="success" size="xs">{t('goals.completed')}</Badge>
            )}
          </div>
          {goal.targetDate && (
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(goal.targetDate).toLocaleDateString(localeString)}
              {daysUntilTarget !== null && daysUntilTarget > 0 && (
                <span className="text-[rgb(var(--text-secondary))]">
                  ({daysUntilTarget} {t('goals.daysLeft')})
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]"
            title={goal.isPaused ? t('goals.resume') : t('goals.pause')}
          >
            {goal.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-[rgb(var(--text-tertiary))] hover:text-negative hover:bg-negative-subtle"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-[rgb(var(--text-primary))]" dir="ltr">
              {formatCurrency(goal.savedAmount, { locale: localeString, symbol: currencySymbol })}
            </div>
            <div className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('goals.of')} {formatCurrency(goal.targetAmount, { locale: localeString, symbol: currencySymbol })}
            </div>
          </div>
          <div className={cn(
            "text-lg font-semibold",
            isCompleted ? "text-positive" : "text-[rgb(var(--accent))]"
          )}>
            {progress.toFixed(0)}%
          </div>
        </div>
        
        <div className="progress-track">
          <div 
            className={cn(
              "progress-fill",
              isCompleted ? "bg-[rgb(var(--positive))]" : "bg-[rgb(var(--accent))]"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Remaining info */}
      {!isCompleted && (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-[rgb(var(--text-tertiary))]">
            {t('goals.remaining')}
          </span>
          <span className="font-medium text-[rgb(var(--text-primary))] tabular-nums" dir="ltr">
            {formatCurrency(remaining, { locale: localeString, symbol: currencySymbol })}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isCompleted ? (
          <Button 
            onClick={onAddMoney} 
            size="sm" 
            className="flex-1"
            disabled={goal.isPaused}
          >
            <Plus className="w-4 h-4" />
            {t('goals.addMoney')}
          </Button>
        ) : (
          <Button 
            variant="success"
            size="sm" 
            className="flex-1"
            disabled
          >
            <CheckCircle className="w-4 h-4" />
            {t('goals.completed')}
          </Button>
        )}
      </div>
    </Card>
  )
}
