'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { WelcomeStep } from './components/WelcomeStep'
import { ProfileStep } from './components/ProfileStep'
import { GoalsStep } from './components/GoalsStep'
import { GoalSetupStep } from './components/GoalSetupStep'
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
    profile: {
      name: '',
      language: locale || 'en',
      currency: currency || 'USD',
      monthStartDay: 1,
    },
    selectedGoals: [], // Just the goal IDs
    configuredGoals: [], // Full goal configurations
    account: null,
    recurringIncome: null,
    recurringExpenses: [],
  })

  // Steps:
  // 0: Welcome
  // 1: Profile
  // 2: Goals (select which goals)
  // 3: GoalSetup (configure each selected goal) - skipped if no goals
  // 4: Account
  // 5: QuickSetup
  // 6: Completion
  const totalSteps = 7
  const progressSteps = 5 // Profile through QuickSetup (excluding GoalSetup if skipped)
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      // If we're on Account step (4) and no goals were selected, go back to Goals (2)
      if (currentStep === 4 && onboardingData.selectedGoals.length === 0) {
        setCurrentStep(2)
      } else {
        setCurrentStep(currentStep - 1)
      }
    }
  }

  const handleProfileComplete = async (profileData) => {
    setOnboardingData(prev => ({ ...prev, profile: profileData }))
    
    // Save profile to database
    try {
      await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
    } catch (error) {
      console.error('Error saving profile:', error)
    }
    
    handleNext()
  }

  const handleGoalsSelected = async (goals) => {
    setOnboardingData(prev => ({ ...prev, selectedGoals: goals }))
    
    // Save selected goals to database
    try {
      await fetch('/api/onboarding/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      })
    } catch (error) {
      console.error('Error saving goals:', error)
    }
    
    // If goals were selected, go to GoalSetup step, otherwise skip to Account
    if (goals.length > 0) {
      setCurrentStep(3) // GoalSetup
    } else {
      setCurrentStep(4) // Account
    }
  }

  const handleGoalSetupComplete = async (configuredGoals) => {
    setOnboardingData(prev => ({ ...prev, configuredGoals }))
    
    // Create savings goals in the database
    try {
      for (const goal of configuredGoals) {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: goal.name,
            icon: goal.icon,
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate,
            currentAmount: goal.initialAmount || 0,
          }),
        })
      }
    } catch (error) {
      console.error('Error creating goals:', error)
    }
    
    setCurrentStep(4) // Go to Account
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

  // Get the current currency based on onboarding data
  const currentCurrency = onboardingData.profile.currency || currency
  const currentCurrencySymbol = currentCurrency === 'ILS' ? '₪' : '$'

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
          <ProfileStep 
            key="profile"
            onNext={handleProfileComplete}
            onBack={handleBack}
            initialData={onboardingData.profile}
          />
        )
      case 2:
        return (
          <GoalsStep 
            key="goals"
            onNext={handleGoalsSelected}
            onBack={handleBack}
            onSkip={() => setCurrentStep(4)} // Skip to Account
            initialGoals={onboardingData.selectedGoals}
          />
        )
      case 3:
        return (
          <GoalSetupStep 
            key="goalsetup"
            selectedGoals={onboardingData.selectedGoals}
            onComplete={handleGoalSetupComplete}
            onBack={handleBack}
            currencySymbol={currentCurrencySymbol}
          />
        )
      case 4:
        return (
          <AddAccountStep 
            key="account"
            onNext={handleAccountCreated}
            onBack={handleBack}
            currency={currentCurrency}
            currencySymbol={currentCurrencySymbol}
          />
        )
      case 5:
        return (
          <QuickSetupStep 
            key="quicksetup"
            onNext={handleQuickSetupComplete}
            onBack={handleBack}
            onSkip={handleNext}
            account={onboardingData.account}
            categories={categories}
            currency={currentCurrency}
            currencySymbol={currentCurrencySymbol}
          />
        )
      case 6:
        return (
          <CompletionStep 
            key="completion"
            onComplete={handleComplete}
            isLoading={isLoading}
            data={onboardingData}
            currencySymbol={currentCurrencySymbol}
          />
        )
      default:
        return null
    }
  }

  // Calculate progress - adjust for skipped GoalSetup step
  const getProgress = () => {
    if (currentStep === 0 || currentStep === totalSteps - 1) return 0
    
    // Adjust step number for progress calculation
    let adjustedStep = currentStep
    if (currentStep > 3 && onboardingData.selectedGoals.length === 0) {
      adjustedStep = currentStep - 1 // Account for skipped GoalSetup
    }
    
    return (adjustedStep / progressSteps) * 100
  }

  // Get current step number for display
  const getDisplayStep = () => {
    if (currentStep === 0 || currentStep === totalSteps - 1) return { current: 0, total: 0 }
    
    let current = currentStep
    let total = progressSteps
    
    // If no goals selected and we're past GoalSetup, adjust
    if (onboardingData.selectedGoals.length === 0 && currentStep > 3) {
      current = currentStep - 1
      total = progressSteps - 1
    }
    
    return { current, total }
  }

  const displayStep = getDisplayStep()

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

      {/* Progress indicator - show for steps 1-5 (not Welcome or Completion) */}
      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 lg:pt-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                {displayStep.current > 0 && t('onboarding.step', { current: displayStep.current, total: displayStep.total })}
              </span>
            </div>
            <div className="h-1 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-light-accent to-blue-500 dark:from-dark-accent dark:to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
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
