'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation } from './translations'

const I18nContext = createContext()

const LOCALES = {
  en: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
  },
  he: {
    code: 'he',
    name: 'עברית',
    direction: 'rtl',
    currency: 'ILS',
    currencySymbol: '₪',
    locale: 'he-IL',
  },
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && LOCALES[savedLocale]) {
      setLocale(savedLocale)
      updateHTMLAttributes(savedLocale)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0]
      if (LOCALES[browserLang]) {
        setLocale(browserLang)
        updateHTMLAttributes(browserLang)
      }
    }
  }, [])

  const updateHTMLAttributes = (newLocale) => {
    const localeConfig = LOCALES[newLocale]
    document.documentElement.lang = newLocale
    document.documentElement.dir = localeConfig.direction
    
    // Update body classes for RTL support
    if (localeConfig.direction === 'rtl') {
      document.body.classList.add('rtl')
    } else {
      document.body.classList.remove('rtl')
    }
  }

  const changeLocale = (newLocale) => {
    if (!LOCALES[newLocale]) return
    
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
    updateHTMLAttributes(newLocale)
  }

  const t = (key, params = {}) => {
    let translation = getTranslation(translations[locale], key) || key
    
    // Replace parameters in translation
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{${param}}`, params[param])
    })
    
    return translation
  }

  const localeConfig = LOCALES[locale]

  const value = {
    locale,
    changeLocale,
    t,
    direction: localeConfig.direction,
    isRTL: localeConfig.direction === 'rtl',
    currency: localeConfig.currency,
    currencySymbol: localeConfig.currencySymbol,
    localeString: localeConfig.locale,
    locales: LOCALES,
    isClient,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

