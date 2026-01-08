'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, PiggyBank, Plane, Home, CreditCard, TrendingUp, GraduationCap, Car, Heart, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export function GoalsStep({ onNext, onBack, onSkip, initialGoals = [] }) {
  const { t, isRTL } = useI18n()
  const [selectedGoals, setSelectedGoals] = useState(initialGoals)

  const goals = [
    { id: 'emergency_fund', icon: PiggyBank, color: 'from-emerald-400 to-green-500' },
    { id: 'vacation', icon: Plane, color: 'from-sky-400 to-blue-500' },
    { id: 'home', icon: Home, color: 'from-amber-400 to-orange-500' },
    { id: 'debt_free', icon: CreditCard, color: 'from-rose-400 to-red-500' },
    { id: 'invest', icon: TrendingUp, color: 'from-violet-400 to-purple-500' },
    { id: 'education', icon: GraduationCap, color: 'from-indigo-400 to-blue-600' },
    { id: 'car', icon: Car, color: 'from-slate-400 to-gray-600' },
    { id: 'wedding', icon: Heart, color: 'from-pink-400 to-rose-500' },
    { id: 'other', icon: Sparkles, color: 'from-cyan-400 to-teal-500' },
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6 mt-6 lg:mt-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Target className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {t('onboarding.goals.title')}
        </h2>
        <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary">
          {t('onboarding.goals.subtitle')}
        </p>
      </motion.div>

      {/* Goals Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-3 gap-2 sm:gap-3 mb-6"
      >
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id)
          return (
            <motion.button
              key={goal.id}
              variants={itemVariants}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              whileTap={{ scale: 0.95 }}
              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-light-border dark:border-dark-border bg-light-elevated dark:bg-dark-elevated hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary'
              }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                </motion.div>
              )}
              
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center shadow-lg`}>
                <goal.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              
              {/* Label */}
              <span className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                isSelected
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              }`}>
                {t(`onboarding.goals.${goal.id}`)}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Selected count */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          {selectedGoals.length === 0 
            ? t('onboarding.goals.selectHint')
            : t('onboarding.goals.selectedCount', { count: selectedGoals.length })
          }
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3.5 px-6 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {t('common.continue')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors"
        >
          {t('onboarding.goals.skip')}
        </button>
      </motion.div>
    </motion.div>
  )
}

