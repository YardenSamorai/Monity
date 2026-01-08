'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, PiggyBank, Plane, Home, CreditCard, TrendingUp, GraduationCap, Car, Heart, Sparkles, ArrowRight, ArrowLeft, Calendar, DollarSign, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

// Goal icons and colors mapping
const GOAL_CONFIG = {
  emergency_fund: { icon: PiggyBank, color: 'from-emerald-400 to-green-500', emoji: '🛡️' },
  vacation: { icon: Plane, color: 'from-sky-400 to-blue-500', emoji: '🏖️' },
  home: { icon: Home, color: 'from-amber-400 to-orange-500', emoji: '🏠' },
  debt_free: { icon: CreditCard, color: 'from-rose-400 to-red-500', emoji: '💳' },
  invest: { icon: TrendingUp, color: 'from-violet-400 to-purple-500', emoji: '📈' },
  education: { icon: GraduationCap, color: 'from-indigo-400 to-blue-600', emoji: '🎓' },
  car: { icon: Car, color: 'from-slate-400 to-gray-600', emoji: '🚗' },
  wedding: { icon: Heart, color: 'from-pink-400 to-rose-500', emoji: '💒' },
  other: { icon: Sparkles, color: 'from-cyan-400 to-teal-500', emoji: '✨' },
}

export function GoalSetupStep({ selectedGoals, onComplete, onBack, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [configuredGoals, setConfiguredGoals] = useState([])
  
  // Form state for current goal
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
    // Validate
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) {
      return
    }

    // Save current goal configuration
    const goalData = {
      goalType: currentGoal,
      name: t(`onboarding.goals.${currentGoal}`),
      icon: goalConfig.emoji,
      targetAmount: Number(formData.targetAmount),
      targetDate: formData.targetDate || null,
      initialAmount: Number(formData.initialAmount) || 0,
    }

    const newConfiguredGoals = [...configuredGoals, goalData]
    setConfiguredGoals(newConfiguredGoals)

    if (isLastGoal) {
      // All goals configured, proceed to next step
      onComplete(newConfiguredGoals)
    } else {
      // Move to next goal with animation
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
      setFormData({ targetAmount: '', targetDate: '', initialAmount: '' })
    }
  }

  const handleSkipGoal = () => {
    if (isLastGoal) {
      onComplete(configuredGoals)
    } else {
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
      setFormData({ targetAmount: '', targetDate: '', initialAmount: '' })
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? (isRTL ? -300 : 300) : (isRTL ? 300 : -300),
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction) => ({
      x: direction > 0 ? (isRTL ? 300 : -300) : (isRTL ? -300 : 300),
      opacity: 0,
      scale: 0.9,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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
      {/* Header with progress */}
      <motion.div variants={itemVariants} className="text-center mb-4 mt-6 lg:mt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {t('onboarding.goalSetup.title')}
        </h2>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
          {t('onboarding.goalSetup.subtitle', { current: currentIndex + 1, total: selectedGoals.length })}
        </p>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-light-border dark:bg-dark-border rounded-full overflow-hidden max-w-xs mx-auto">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${goalConfig.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        {/* Goal dots */}
        <div className="flex justify-center gap-2 mt-3">
          {selectedGoals.map((goal, idx) => {
            const config = GOAL_CONFIG[goal] || GOAL_CONFIG.other
            const isCompleted = idx < currentIndex
            const isCurrent = idx === currentIndex
            return (
              <motion.div
                key={goal}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: isCurrent ? 1.2 : 1,
                  opacity: isCompleted ? 0.5 : 1 
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isCurrent 
                    ? `bg-gradient-to-br ${config.color} text-white shadow-lg`
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : config.emoji}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Goal Card Carousel */}
      <div className="relative overflow-hidden min-h-[320px] sm:min-h-[340px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentGoal}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {/* Goal Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              {/* Goal header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${goalConfig.color} flex items-center justify-center shadow-lg`}>
                  <GoalIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {t(`onboarding.goals.${currentGoal}`)}
                  </h3>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('onboarding.goalSetup.configureGoal')}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Target Amount */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    <DollarSign className="w-4 h-4" />
                    {t('onboarding.goalSetup.targetAmount')}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary font-medium">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Target Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    <Calendar className="w-4 h-4" />
                    {t('onboarding.goalSetup.targetDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                  />
                  <p className="mt-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('onboarding.goalSetup.targetDateHint')}
                  </p>
                </div>

                {/* Initial Amount */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    <PiggyBank className="w-4 h-4" />
                    {t('onboarding.goalSetup.initialAmount')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary font-medium">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={formData.initialAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, initialAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                      dir="ltr"
                    />
                  </div>
                  <p className="mt-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('onboarding.goalSetup.initialAmountHint')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="mt-4 space-y-3">
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
            onClick={handleNext}
            disabled={!formData.targetAmount || Number(formData.targetAmount) <= 0}
            className={`flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r ${goalConfig.color} text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLastGoal ? t('onboarding.goalSetup.finish') : t('onboarding.goalSetup.nextGoal')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSkipGoal}
          className="w-full py-2 text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors"
        >
          {isLastGoal ? t('onboarding.goalSetup.skipAll') : t('onboarding.goalSetup.skipGoal')}
        </button>
      </motion.div>
    </motion.div>
  )
}

