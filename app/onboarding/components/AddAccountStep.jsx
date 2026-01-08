'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Building2, CreditCard, Banknote, ArrowRight, ArrowLeft, Lightbulb, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'

export function AddAccountStep({ onNext, onBack, currency, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('bank')
  const [shake, setShake] = useState(false)
  const [errors, setErrors] = useState({
    name: false,
    balance: false,
  })
  
  const [formData, setFormData] = useState({
    name: '',
    balance: '0',
  })

  const accountTypes = [
    { id: 'bank', icon: Building2, label: t('onboarding.account.typeBank') },
    { id: 'cash', icon: Banknote, label: t('onboarding.account.typeCash') },
    { id: 'credit', icon: CreditCard, label: t('onboarding.account.typeCredit') },
  ]

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({ name: false, balance: false })
    
    // Validate
    let hasError = false
    const newErrors = { name: false, balance: false }
    
    if (!formData.name.trim()) {
      newErrors.name = true
      hasError = true
    }

    // Balance is optional, default is 0. Only validate if user entered invalid value
    const balanceValue = formData.balance.trim()
    if (balanceValue && isNaN(Number(balanceValue))) {
      newErrors.balance = true
      hasError = true
    }
    
    if (hasError) {
      setErrors(newErrors)
      triggerShake()
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: selectedType,
          balance: Number(formData.balance) || 0,
          currency: currency,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create account')
      }

      const data = await response.json()
      onNext(data.account)
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear error when user starts typing
  const handleNameChange = (e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }))
    if (errors.name && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, name: false }))
    }
  }

  const handleBalanceChange = (e) => {
    setFormData(prev => ({ ...prev, balance: e.target.value }))
    if (errors.balance && e.target.value && !isNaN(Number(e.target.value))) {
      setErrors(prev => ({ ...prev, balance: false }))
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  }

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
    still: {
      x: 0,
    },
  }

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { duration: 0.2 }
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8 mt-8 lg:mt-0">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-light-accent/20 to-blue-500/20 dark:from-dark-accent/20 dark:to-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-light-accent dark:text-dark-accent" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {t('onboarding.account.title')}
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {t('onboarding.account.subtitle')}
        </p>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit}
        variants={shakeVariants}
        animate={shake ? 'shake' : 'still'}
      >
        {/* Account Type Selection */}
        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
            {t('onboarding.account.typeLabel')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {accountTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  selectedType === type.id
                    ? 'border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10'
                    : 'border-light-border dark:border-dark-border bg-light-elevated dark:bg-dark-elevated hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary'
                }`}
              >
                <type.icon className={`w-6 h-6 ${
                  selectedType === type.id 
                    ? 'text-light-accent dark:text-dark-accent' 
                    : 'text-light-text-tertiary dark:text-dark-text-tertiary'
                }`} />
                <span className={`text-xs font-medium ${
                  selectedType === type.id 
                    ? 'text-light-accent dark:text-dark-accent' 
                    : 'text-light-text-secondary dark:text-dark-text-secondary'
                }`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Account Name */}
        <motion.div variants={itemVariants} className="mb-4">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            {t('onboarding.account.nameLabel')}
            <span className="text-rose-500 ml-1">*</span>
          </label>
          
          {/* Error Message */}
          <AnimatePresence>
            {errors.name && (
              <motion.div
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 mb-2 text-rose-500"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('onboarding.account.errorName')}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            placeholder={t('onboarding.account.namePlaceholder')}
            className={`w-full px-4 py-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              errors.name 
                ? 'border-rose-500 focus:ring-rose-500' 
                : 'border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent'
            }`}
            autoFocus
          />
        </motion.div>

        {/* Balance */}
        <motion.div variants={itemVariants} className="mb-4">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            {t('onboarding.account.balanceLabel')}
          </label>
          
          {/* Error Message */}
          <AnimatePresence>
            {errors.balance && (
              <motion.div
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 mb-2 text-rose-500"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('onboarding.account.errorBalance')}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={formData.balance}
              onChange={handleBalanceChange}
              placeholder="0"
              className={`w-full px-4 py-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:border-transparent transition-all text-start ${
                errors.balance 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent'
              }`}
              style={{ paddingInlineStart: '2.5rem' }}
              dir="ltr"
            />
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div 
          variants={itemVariants}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 mb-8"
        >
          <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t('onboarding.account.tip')}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3.5 px-6 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary font-medium flex items-center justify-center gap-2 hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-light-accent/20 dark:shadow-dark-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t('common.continue')}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
