'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Globe, DollarSign, Calendar, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export function ProfileStep({ onNext, onBack, initialData }) {
  const { t, isRTL, locale, changeLocale } = useI18n()
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    language: initialData?.language || locale || 'en',
    currency: initialData?.currency || (locale === 'he' ? 'ILS' : 'USD'),
    monthStartDay: initialData?.monthStartDay || 1,
  })

  // Update currency when language changes
  useEffect(() => {
    if (formData.language === 'he' && formData.currency === 'USD') {
      setFormData(prev => ({ ...prev, currency: 'ILS' }))
    } else if (formData.language === 'en' && formData.currency === 'ILS') {
      setFormData(prev => ({ ...prev, currency: 'USD' }))
    }
  }, [formData.language])

  const handleLanguageChange = (lang) => {
    setFormData(prev => ({ ...prev, language: lang }))
    changeLocale(lang) // Update app language immediately
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onNext(formData)
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

  const languages = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'he', label: 'עברית', flag: '🇮🇱' },
  ]

  const currencies = [
    { id: 'USD', symbol: '$', label: 'USD' },
    { id: 'ILS', symbol: '₪', label: 'ILS' },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8 mt-6 lg:mt-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7 sm:w-8 sm:h-8 text-violet-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {t('onboarding.profile.title')}
        </h2>
        <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary">
          {t('onboarding.profile.subtitle')}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <motion.div variants={itemVariants} className="mb-5">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            {t('onboarding.profile.nameLabel')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('onboarding.profile.namePlaceholder')}
            className="w-full px-4 py-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            autoFocus
          />
        </motion.div>

        {/* Language Selection */}
        <motion.div variants={itemVariants} className="mb-5">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            <Globe className="w-4 h-4 inline-block mr-1.5 mb-0.5" />
            {t('onboarding.profile.languageLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-3 ${
                  formData.language === lang.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-light-border dark:border-dark-border bg-light-elevated dark:bg-dark-elevated hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`font-medium ${
                  formData.language === lang.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-light-text-primary dark:text-dark-text-primary'
                }`}>
                  {lang.label}
                </span>
                {formData.language === lang.id && (
                  <Check className="w-5 h-5 text-violet-500" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Currency Selection */}
        <motion.div variants={itemVariants} className="mb-5">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            <DollarSign className="w-4 h-4 inline-block mr-1.5 mb-0.5" />
            {t('onboarding.profile.currencyLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {currencies.map((curr) => (
              <button
                key={curr.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, currency: curr.id }))}
                className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  formData.currency === curr.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-light-border dark:border-dark-border bg-light-elevated dark:bg-dark-elevated hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary'
                }`}
              >
                <span className={`text-xl font-bold ${
                  formData.currency === curr.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-light-text-tertiary dark:text-dark-text-tertiary'
                }`}>
                  {curr.symbol}
                </span>
                <span className={`font-medium ${
                  formData.currency === curr.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-light-text-primary dark:text-dark-text-primary'
                }`}>
                  {curr.label}
                </span>
                {formData.currency === curr.id && (
                  <Check className="w-5 h-5 text-violet-500" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Month Start Day */}
        <motion.div variants={itemVariants} className="mb-8">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            <Calendar className="w-4 h-4 inline-block mr-1.5 mb-0.5" />
            {t('onboarding.profile.monthStartLabel')}
          </label>
          <select
            value={formData.monthStartDay}
            onChange={(e) => setFormData(prev => ({ ...prev, monthStartDay: Number(e.target.value) }))}
            className="w-full px-4 py-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          >
            {[...Array(28)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1 === 1 
                  ? t('onboarding.profile.monthStartFirst')
                  : t('onboarding.profile.monthStartDay', { day: i + 1 })
                }
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            {t('onboarding.profile.monthStartHelp')}
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
            className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            {t('common.continue')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>
      </form>
    </motion.div>
  )
}

