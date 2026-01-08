'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { WelcomeStep } from './components/WelcomeStep'
import { AddAccountStep } from './components/AddAccountStep'
import { QuickSetupStep } from './components/QuickSetupStep'
import { CompletionStep } from './components/CompletionStep'

export function OnboardingClient({ categories }) {
  const router = useRouter()
  const { t, isRTL, locale, currencySymbol, currency } = useI18n()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Store the data collected during onboarding
  const [onboardingData, setOnboardingData] = useState({
    account: null,
    recurringIncome: null,
    recurringExpenses: [],
  })

  const totalSteps = 4
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAccountCreated = (account) => {
    setOnboardingData(prev => ({ ...prev, account }))
    handleNext()
  }

  const handleQuickSetupComplete = (data) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      recurringIncome: data.recurringIncome,
      recurringExpenses: data.recurringExpenses 
    }))
    handleNext()
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Mark onboarding as complete
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      toast.success(
        t('onboarding.success'),
        t('onboarding.successDescription')
      )
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Page transition variants
  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? (isRTL ? -300 : 300) : (isRTL ? 300 : -300),
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction) => ({
      x: direction > 0 ? (isRTL ? 300 : -300) : (isRTL ? -300 : 300),
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  const [direction, setDirection] = useState(1)

  useEffect(() => {
    setDirection(1)
  }, [currentStep])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep 
            key="welcome"
            onNext={handleNext} 
          />
        )
      case 1:
        return (
          <AddAccountStep 
            key="account"
            onNext={handleAccountCreated}
            onBack={handleBack}
            currency={currency}
            currencySymbol={currencySymbol}
          />
        )
      case 2:
        return (
          <QuickSetupStep 
            key="quicksetup"
            onNext={handleQuickSetupComplete}
            onBack={handleBack}
            onSkip={handleNext}
            account={onboardingData.account}
            categories={categories}
            currency={currency}
            currencySymbol={currencySymbol}
          />
        )
      case 3:
        return (
          <CompletionStep 
            key="completion"
            onComplete={handleComplete}
            isLoading={isLoading}
            data={onboardingData}
            currencySymbol={currencySymbol}
          />
        )
      default:
        return null
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-light-elevated dark:from-dark-bg dark:via-dark-surface dark:to-dark-elevated"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-light-accent/10 dark:bg-dark-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Progress indicator */}
      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 lg:pt-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                {t('onboarding.step', { current: currentStep, total: totalSteps - 2 })}
              </span>
            </div>
            <div className="h-1 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-light-accent to-blue-500 dark:from-dark-accent dark:to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep) / (totalSteps - 2)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8 sm:py-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

