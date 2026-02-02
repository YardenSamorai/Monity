'use client'

import { useState } from 'react'
import { Target, PiggyBank, Plane, Home, CreditCard, TrendingUp, GraduationCap, Car, Heart, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

export function GoalsStep({ onNext, onBack, onSkip, initialGoals = [] }) {
  const { t, isRTL } = useI18n()
  const [selectedGoals, setSelectedGoals] = useState(initialGoals)

  const goals = [
    { id: 'emergency_fund', icon: PiggyBank },
    { id: 'vacation', icon: Plane },
    { id: 'home', icon: Home },
    { id: 'debt_free', icon: CreditCard },
    { id: 'invest', icon: TrendingUp },
    { id: 'education', icon: GraduationCap },
    { id: 'car', icon: Car },
    { id: 'wedding', icon: Heart },
    { id: 'other', icon: Sparkles },
  ]

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleSubmit = () => {
    onNext(selectedGoals)
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center mx-auto mb-4">
          <Target className="w-6 h-6 text-[rgb(var(--accent))]" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {t('onboarding.goals.title')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('onboarding.goals.subtitle')}
        </p>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id)
          const Icon = goal.icon
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                isSelected
                  ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5"
                  : "border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] hover:border-[rgb(var(--border-secondary))]"
              )}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isSelected
                  ? "bg-[rgb(var(--accent))]/10"
                  : "bg-[rgb(var(--bg-tertiary))]"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isSelected
                    ? "text-[rgb(var(--accent))]"
                    : "text-[rgb(var(--text-tertiary))]"
                )} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                isSelected
                  ? "text-[rgb(var(--accent))]"
                  : "text-[rgb(var(--text-secondary))]"
              )}>
                {t(`onboarding.goals.${goal.id}`)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected count */}
      <div className="text-center mb-6">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {selectedGoals.length === 0 
            ? t('onboarding.goals.selectHint')
            : t('onboarding.goals.selectedCount', { count: selectedGoals.length })
          }
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-medium flex items-center justify-center gap-2 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            <ArrowLeft className={cn("w-4 h-4", isRTL && "rtl-flip")} />
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-[2] py-3 px-4 rounded-xl bg-[rgb(var(--accent))] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t('common.continue')}
            <ArrowRight className={cn("w-4 h-4", isRTL && "rtl-flip")} />
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-[rgb(var(--text-tertiary))] text-sm font-medium hover:text-[rgb(var(--text-secondary))] transition-colors"
        >
          {t('onboarding.goals.skip')}
        </button>
      </div>
    </div>
  )
}
