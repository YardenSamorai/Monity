'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation } from './translations'
import { CURRENCIES, getCurrencySymbol } from './currency'

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
  const [currency, setCurrency] = useState('USD')
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

    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem('currency')
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrency(savedCurrency)
    } else {
      // Default to locale currency
      const localeConfig = LOCALES[savedLocale || 'en']
      setCurrency(localeConfig.currency)
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
    
    // Optionally update currency to match locale (user can override)
    const localeConfig = LOCALES[newLocale]
    if (!localStorage.getItem('currency')) {
      setCurrency(localeConfig.currency)
    }
  }

  const changeCurrency = (newCurrency) => {
    if (!CURRENCIES[newCurrency]) return
    
    setCurrency(newCurrency)
    localStorage.setItem('currency', newCurrency)
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
  const currencySymbol = getCurrencySymbol(currency)

  const value = {
    locale,
    changeLocale,
    currency,
    changeCurrency,
    t,
    direction: localeConfig.direction,
    isRTL: localeConfig.direction === 'rtl',
    currencySymbol,
    localeString: localeConfig.locale,
    locales: LOCALES,
    isClient,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Default t() function for SSR that actually uses translations
const defaultT = (key, params = {}) => {
  let translation = getTranslation(translations.en, key) || key
  Object.keys(params).forEach((param) => {
    translation = translation.replace(`{${param}}`, params[param])
  })
  return translation
}

// Default values for SSR/initial render
const defaultI18nValue = {
  locale: 'en',
  changeLocale: () => {},
  currency: 'USD',
  changeCurrency: () => {},
  t: defaultT,
  direction: 'ltr',
  isRTL: false,
  currencySymbol: '$',
  localeString: 'en-US',
  locales: {
    en: { code: 'en', name: 'English', direction: 'ltr', currency: 'USD', currencySymbol: '$', locale: 'en-US' },
    he: { code: 'he', name: 'עברית', direction: 'rtl', currency: 'ILS', currencySymbol: '₪', locale: 'he-IL' },
  },
  isClient: false,
}

export function useI18n() {
  const context = useContext(I18nContext)
  // Return default values if context is not available (SSR)
  if (!context) {
    return defaultI18nValue
  }
  return context
}

