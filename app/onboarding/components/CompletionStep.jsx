'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Rocket, ArrowRight, Wallet, TrendingUp, Target, Calendar } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import Confetti from 'react-confetti'

export function CompletionStep({ onComplete, isLoading, data, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  }

  const checkVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 },
    },
  }

  const nextSteps = [
    { icon: Wallet, text: t('onboarding.completion.nextStep1') },
    { icon: Target, text: t('onboarding.completion.nextStep2') },
    { icon: Calendar, text: t('onboarding.completion.nextStep3') },
  ]

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          colors={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']}
        />
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        {/* Success Icon */}
        <motion.div variants={checkVariants} className="mb-6">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            {/* Sparkles */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute -bottom-1 -left-3"
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          variants={itemVariants}
          className="text-3xl lg:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3"
        >
          {t('onboarding.completion.title')}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-light-text-secondary dark:text-dark-text-secondary mb-8"
        >
          {t('onboarding.completion.subtitle')}
        </motion.p>

        {/* Summary Card */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border mb-6 text-start"
        >
          <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-light-accent dark:text-dark-accent" />
            {t('onboarding.completion.summary')}
          </h3>
          
          <div className="space-y-3">
            {/* Account */}
            {data.account && (
              <div className="flex items-center justify-between py-2 border-b border-light-border/50 dark:border-dark-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-light-accent dark:text-dark-accent" />
                  </div>
                  <span className="text-light-text-primary dark:text-dark-text-primary">
                    {data.account.name}
                  </span>
                </div>
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
                  {currencySymbol}{Number(data.account.balance).toLocaleString()}
                </span>
              </div>
            )}

            {/* Recurring Income */}
            {data.recurringIncome && (
              <div className="flex items-center justify-between py-2 border-b border-light-border/50 dark:border-dark-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-light-text-primary dark:text-dark-text-primary">
                    {data.recurringIncome.description}
                  </span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400" dir="ltr">
                  +{currencySymbol}{Number(data.recurringIncome.amount).toLocaleString()}
                </span>
              </div>
            )}

            {/* Recurring Expenses */}
            {data.recurringExpenses?.map((expense, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-light-border/50 dark:border-dark-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-light-text-primary dark:text-dark-text-primary">
                    {expense.description}
                  </span>
                </div>
                <span className="font-semibold text-rose-600 dark:text-rose-400" dir="ltr">
                  -{currencySymbol}{Number(expense.amount).toLocaleString()}
                </span>
              </div>
            ))}

            {/* Empty state if skipped */}
            {!data.recurringIncome && (!data.recurringExpenses || data.recurringExpenses.length === 0) && (
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary py-2">
                {t('onboarding.completion.noRecurring')}
              </p>
            )}
          </div>
        </motion.div>

        {/* What's Next */}
        <motion.div variants={itemVariants} className="mb-8">
          <h4 className="text-sm font-semibold text-light-text-tertiary dark:text-dark-text-tertiary mb-3">
            {t('onboarding.completion.whatsNext')}
          </h4>
          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-light-surface dark:bg-dark-surface text-start"
              >
                <step.icon className="w-5 h-5 text-light-accent dark:text-dark-accent flex-shrink-0" />
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          variants={itemVariants}
          onClick={onComplete}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white font-semibold text-lg shadow-xl shadow-light-accent/30 dark:shadow-dark-accent/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              {t('onboarding.completion.cta')}
              <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </>
          )}
        </motion.button>
      </motion.div>
    </>
  )
}

