'use client'

import { useState, useEffect } from 'react'
import { User, Globe, DollarSign, Calendar, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

export function ProfileStep({ onNext, onBack, initialData }) {
  const { t, isRTL, locale, changeLocale } = useI18n()
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    language: initialData?.language || locale || 'en',
    currency: initialData?.currency || (locale === 'he' ? 'ILS' : 'USD'),
    monthStartDay: initialData?.monthStartDay || 1,
  })

  useEffect(() => {
    if (formData.language === 'he' && formData.currency === 'USD') {
      setFormData(prev => ({ ...prev, currency: 'ILS' }))
    } else if (formData.language === 'en' && formData.currency === 'ILS') {
      setFormData(prev => ({ ...prev, currency: 'USD' }))
    }
  }, [formData.language])

  const handleLanguageChange = (lang) => {
    setFormData(prev => ({ ...prev, language: lang }))
    changeLocale(lang)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onNext(formData)
  }

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'he', label: 'עברית' },
  ]

  const currencies = [
    { id: 'USD', symbol: '$', label: 'USD' },
    { id: 'ILS', symbol: '₪', label: 'ILS' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-[rgb(var(--accent))]" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {t('onboarding.profile.title')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('onboarding.profile.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('onboarding.profile.nameLabel')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('onboarding.profile.namePlaceholder')}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Language Selection */}
        <div className="mb-5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <Globe className="w-4 h-4" />
            {t('onboarding.profile.languageLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                  formData.language === lang.id
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5"
                    : "border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] hover:border-[rgb(var(--border-secondary))]"
                )}
              >
                <span className={cn(
                  "font-medium text-sm",
                  formData.language === lang.id
                    ? "text-[rgb(var(--accent))]"
                    : "text-[rgb(var(--text-primary))]"
                )}>
                  {lang.label}
                </span>
                {formData.language === lang.id && (
                  <Check className="w-4 h-4 text-[rgb(var(--accent))]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selection */}
        <div className="mb-5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <DollarSign className="w-4 h-4" />
            {t('onboarding.profile.currencyLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {currencies.map((curr) => (
              <button
                key={curr.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, currency: curr.id }))}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                  formData.currency === curr.id
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5"
                    : "border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] hover:border-[rgb(var(--border-secondary))]"
                )}
              >
                <span className={cn(
                  "text-lg font-bold",
                  formData.currency === curr.id
                    ? "text-[rgb(var(--accent))]"
                    : "text-[rgb(var(--text-tertiary))]"
                )}>
                  {curr.symbol}
                </span>
                <span className={cn(
                  "font-medium text-sm",
                  formData.currency === curr.id
                    ? "text-[rgb(var(--accent))]"
                    : "text-[rgb(var(--text-primary))]"
                )}>
                  {curr.label}
                </span>
                {formData.currency === curr.id && (
                  <Check className="w-4 h-4 text-[rgb(var(--accent))]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Month Start Day */}
        <div className="mb-8">
          <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            <Calendar className="w-4 h-4" />
            {t('onboarding.profile.monthStartLabel')}
          </label>
          <select
            value={formData.monthStartDay}
            onChange={(e) => setFormData(prev => ({ ...prev, monthStartDay: Number(e.target.value) }))}
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all"
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
          <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
            {t('onboarding.profile.monthStartHelp')}
          </p>
        </div>

        {/* Actions */}
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
            type="submit"
            className="flex-[2] py-3 px-4 rounded-xl bg-[rgb(var(--accent))] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t('common.continue')}
            <ArrowRight className={cn("w-4 h-4", isRTL && "rtl-flip")} />
          </button>
        </div>
      </form>
    </div>
  )
}
