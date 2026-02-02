'use client'

import { useState } from 'react'
import { Target, PiggyBank, Plane, Home, CreditCard, TrendingUp, GraduationCap, Car, Heart, Sparkles, ArrowRight, ArrowLeft, Calendar, DollarSign } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

const GOAL_CONFIG = {
  emergency_fund: { icon: PiggyBank },
  vacation: { icon: Plane },
  home: { icon: Home },
  debt_free: { icon: CreditCard },
  invest: { icon: TrendingUp },
  education: { icon: GraduationCap },
  car: { icon: Car },
  wedding: { icon: Heart },
  other: { icon: Sparkles },
}

export function GoalSetupStep({ selectedGoals, onComplete, onBack, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [configuredGoals, setConfiguredGoals] = useState([])
  
  const [formData, setFormData] = useState({
    targetAmount: '',
    targetDate: '',
    initialAmount: '',
  })

  const currentGoal = selectedGoals[currentIndex]
  const goalConfig = GOAL_CONFIG[currentGoal] || GOAL_CONFIG.other
  const GoalIcon = goalConfig.icon
  const isLastGoal = currentIndex === selectedGoals.length - 1
  const progress = ((currentIndex + 1) / selectedGoals.length) * 100

  const handleNext = () => {
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) {
      return
    }

    const goalData = {
      goalType: currentGoal,
      name: t(`onboarding.goals.${currentGoal}`),
      icon: currentGoal,
      targetAmount: Number(formData.targetAmount),
      targetDate: formData.targetDate || null,
      initialAmount: Number(formData.initialAmount) || 0,
    }

    const newConfiguredGoals = [...configuredGoals, goalData]
    setConfiguredGoals(newConfiguredGoals)

    if (isLastGoal) {
      onComplete(newConfiguredGoals)
    } else {
      setCurrentIndex(currentIndex + 1)
      setFormData({ targetAmount: '', targetDate: '', initialAmount: '' })
    }
  }

  const handleSkipGoal = () => {
    if (isLastGoal) {
      onComplete(configuredGoals)
    } else {
      setCurrentIndex(currentIndex + 1)
      setFormData({ targetAmount: '', targetDate: '', initialAmount: '' })
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('onboarding.goalSetup.goalProgress', { current: currentIndex + 1, total: selectedGoals.length })}
          </span>
          <span className="text-xs font-medium text-[rgb(var(--accent))]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 bg-[rgb(var(--border-primary))] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[rgb(var(--accent))] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center mx-auto mb-4">
          <GoalIcon className="w-7 h-7 text-[rgb(var(--accent))]" />
        </div>
        <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">
          {t(`onboarding.goals.${currentGoal}`)}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('onboarding.goalSetup.configureGoal')}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        {/* Target Amount */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <DollarSign className="w-4 h-4" />
            {t('onboarding.goalSetup.targetAmount')}
            <span className="text-[rgb(var(--negative))]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              placeholder="10,000"
              className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent"
              style={{ paddingInlineStart: '2.5rem' }}
              dir="ltr"
            />
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <Calendar className="w-4 h-4" />
            {t('onboarding.goalSetup.targetDate')}
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent"
          />
        </div>

        {/* Initial Amount */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <Target className="w-4 h-4" />
            {t('onboarding.goalSetup.initialAmount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={formData.initialAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, initialAmount: e.target.value }))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent"
              style={{ paddingInlineStart: '2.5rem' }}
              dir="ltr"
            />
          </div>
        </div>
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
            onClick={handleNext}
            disabled={!formData.targetAmount}
            className="flex-[2] py-3 px-4 rounded-xl bg-[rgb(var(--accent))] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLastGoal ? t('common.continue') : t('onboarding.goalSetup.nextGoal')}
            <ArrowRight className={cn("w-4 h-4", isRTL && "rtl-flip")} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSkipGoal}
          className="w-full py-2 text-[rgb(var(--text-tertiary))] text-sm font-medium hover:text-[rgb(var(--text-secondary))] transition-colors"
        >
          {t('onboarding.goalSetup.skipGoal')}
        </button>
      </div>
    </div>
  )
}
