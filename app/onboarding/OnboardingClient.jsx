'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { WelcomeStep } from './components/WelcomeStep'
import { ProfileStep } from './components/ProfileStep'
import { GoalsStep } from './components/GoalsStep'
import { GoalSetupStep } from './components/GoalSetupStep'
import { AddAccountStep } from './components/AddAccountStep'
import { QuickSetupStep } from './components/QuickSetupStep'
import { CompletionStep } from './components/CompletionStep'
import { cn } from '@/lib/utils'

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
    selectedGoals: [],
    configuredGoals: [],
    account: null,
    recurringIncome: null,
    recurringExpenses: [],
  })

  const totalSteps = 7
  const progressSteps = 5
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      if (currentStep === 4 && onboardingData.selectedGoals.length === 0) {
        setCurrentStep(2)
      } else {
        setCurrentStep(currentStep - 1)
      }
    }
  }

  const handleProfileComplete = async (profileData) => {
    setOnboardingData(prev => ({ ...prev, profile: profileData }))
    
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
    
    try {
      await fetch('/api/onboarding/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      })
    } catch (error) {
      console.error('Error saving goals:', error)
    }
    
    if (goals.length > 0) {
      setCurrentStep(3)
    } else {
      setCurrentStep(4)
    }
  }

  const handleGoalSetupComplete = async (configuredGoals) => {
    setOnboardingData(prev => ({ ...prev, configuredGoals }))
    
    try {
      for (const goal of configuredGoals) {
        const response = await fetch('/api/goals', {
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
        if (!response.ok) {
          console.error('Failed to create goal:', goal.name)
        }
      }
    } catch (error) {
      console.error('Error creating goals:', error)
    }
    
    setCurrentStep(4)
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
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const currentCurrency = onboardingData.profile.currency || currency
  const currentCurrencySymbol = currentCurrency === 'ILS' ? '₪' : '$'

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep key="welcome" onNext={handleNext} />
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
            onSkip={() => setCurrentStep(4)}
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

  const getProgress = () => {
    if (currentStep === 0 || currentStep === totalSteps - 1) return 0
    
    let adjustedStep = currentStep
    if (currentStep > 3 && onboardingData.selectedGoals.length === 0) {
      adjustedStep = currentStep - 1
    }
    
    return (adjustedStep / progressSteps) * 100
  }

  const getDisplayStep = () => {
    if (currentStep === 0 || currentStep === totalSteps - 1) return { current: 0, total: 0 }
    
    let current = currentStep
    let total = progressSteps
    
    if (onboardingData.selectedGoals.length === 0 && currentStep > 3) {
      current = currentStep - 1
      total = progressSteps - 1
    }
    
    return { current, total }
  }

  const displayStep = getDisplayStep()

  return (
    <div 
      className="min-h-screen bg-[rgb(var(--bg-primary))]"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Progress indicator */}
      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 lg:pt-6 bg-[rgb(var(--bg-primary))]">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {displayStep.current > 0 && t('onboarding.step', { current: displayStep.current, total: displayStep.total })}
              </span>
            </div>
            <div className="h-1 bg-[rgb(var(--border-primary))] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[rgb(var(--accent))] rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md py-16">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
