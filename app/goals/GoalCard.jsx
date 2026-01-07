'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import {
  MoreVertical,
  Plus,
  Edit,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Sparkles,
} from 'lucide-react'
import { ForecastPanel } from './ForecastPanel'

export function GoalCard({ 
  goal, 
  onAddMoney, 
  onEdit, 
  onDelete, 
  onTogglePause,
  onMarkCompleted,
  onForecastToggle,
  isForecastExpanded 
}) {
  const { t, currencySymbol, localeString } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const progress = (goal.savedAmount / goal.targetAmount) * 100
  const remaining = goal.targetAmount - goal.savedAmount

  // Calculate on-track status if target date exists
  const onTrackStatus = useMemo(() => {
    if (!goal.targetDate) return null

    const today = new Date()
    const targetDate = new Date(goal.targetDate)
    const monthsLeft = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)))
    const requiredMonthly = remaining / monthsLeft

    // Mock: get this month's contribution (in real app, calculate from contributions)
    const thisMonthContribution = goal.fixedMonthlyAmount || 0

    if (thisMonthContribution >= requiredMonthly * 1.1) {
      return { status: 'ahead', message: t('goals.ahead'), color: 'emerald' }
    } else if (thisMonthContribution >= requiredMonthly * 0.9) {
      return { status: 'onTrack', message: t('goals.onTrack'), color: 'blue' }
    } else {
      return { status: 'behind', message: t('goals.behind'), color: 'amber' }
    }
  }, [goal, remaining, t])

  // Calculate milestone
  const milestone = useMemo(() => {
    if (progress >= 100) return { percent: 100, label: t('goals.completed') }
    if (progress >= 75) return { percent: 75, label: t('goals.threeQuarters') }
    if (progress >= 50) return { percent: 50, label: t('goals.halfway') }
    if (progress >= 25) return { percent: 25, label: t('goals.quarter') }
    return null
  }, [progress, t])

  // Progress ring calculation
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (progress / 100) * circumference

  return (
    <Card className="relative overflow-hidden group">
      {/* Menu Button */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 z-20 w-48 bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border rounded-xl shadow-lg p-1">
                <button
                  onClick={() => {
                    onEdit({})
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface text-sm text-light-text-primary dark:text-dark-text-primary"
                >
                  <Edit className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => {
                    onTogglePause()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface text-sm text-light-text-primary dark:text-dark-text-primary"
                >
                  {goal.isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      {t('goals.resume')}
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      {t('goals.pause')}
                    </>
                  )}
                </button>
                {progress < 100 && (
                  <button
                    onClick={() => {
                      onMarkCompleted()
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface text-sm text-light-text-primary dark:text-dark-text-primary"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('goals.markCompleted')}
                  </button>
                )}
                <div className="h-px bg-light-border dark:bg-dark-border my-1" />
                <button
                  onClick={() => {
                    onDelete()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface text-sm text-light-danger dark:text-dark-danger"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">{goal.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 truncate">
              {goal.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {t(`goals.priorityOptions.${goal.priority}`)}
              </Badge>
              {goal.isPaused && (
                <Badge variant="secondary" className="text-xs">
                  {t('goals.paused')}
                </Badge>
              )}
              {onTrackStatus && (
                <Badge 
                  variant={onTrackStatus.color === 'emerald' ? 'success' : onTrackStatus.color === 'amber' ? 'warning' : 'default'}
                  className="text-xs"
                >
                  {onTrackStatus.message}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-light-border dark:text-dark-border"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-light-accent dark:text-dark-accent transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div>
                <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                  {t('goals.saved')}
                </div>
                <div className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
                  {formatCurrency(goal.savedAmount, { locale: localeString, symbol: currencySymbol })}
                </div>
              </div>
              <div>
                <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                  {t('goals.target')}
                </div>
                <div className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary" dir="ltr">
                  {formatCurrency(goal.targetAmount, { locale: localeString, symbol: currencySymbol })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remaining & Target Date */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {t('goals.remaining')}
            </span>
            <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
              {formatCurrency(remaining, { locale: localeString, symbol: currencySymbol })}
            </span>
          </div>
          
          {goal.targetDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('goals.targetDate')}
              </span>
              <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                {formatDate(goal.targetDate, 'short', { locale: localeString })}
              </span>
            </div>
          )}

          {goal.contributionMode === 'fixed' && goal.fixedMonthlyAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                {t('goals.monthlyContribution')}
              </span>
              <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary" dir="ltr">
                {formatCurrency(goal.fixedMonthlyAmount, { locale: localeString, symbol: currencySymbol })}
              </span>
            </div>
          )}

          {onTrackStatus && goal.targetDate && (
            <div className="pt-2 border-t border-light-border dark:border-dark-border">
              <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                {t('goals.toStayOnTrack')}
              </div>
              <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mt-1" dir="ltr">
                {formatCurrency((remaining / Math.max(1, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)))), { locale: localeString, symbol: currencySymbol })}/month
              </div>
            </div>
          )}
        </div>

        {/* Milestone */}
        {milestone && milestone.percent < 100 && (
          <div className="mb-4 p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-light-accent dark:text-dark-accent" />
              <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                {t('goals.milestoneReached', { percent: milestone.percent, label: milestone.label })}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={onAddMoney}
            disabled={goal.isPaused || progress >= 100}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('goals.addMoney')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onForecastToggle}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Forecast Panel */}
      {isForecastExpanded && (
        <div className="border-t border-light-border dark:border-dark-border">
          <ForecastPanel goal={goal} />
        </div>
      )}
    </Card>
  )
}

