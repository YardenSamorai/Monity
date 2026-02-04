'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Select } from './Input'
import { useI18n } from '@/lib/i18n-context'
import { CURRENCIES, getCurrencySymbol, getCurrencyName } from '@/lib/currency'

export function CurrencySelector() {
  const { currency, changeCurrency, locale } = useI18n()
  const [selectedCurrency, setSelectedCurrency] = useState(currency)

  useEffect(() => {
    setSelectedCurrency(currency)
  }, [currency])

  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency)
    changeCurrency(newCurrency, true) // Reload page to update all amounts
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4" />
          {locale === 'he' ? 'מטבע' : 'Currency'}
        </div>
      </label>
      <Select
        value={selectedCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        className="w-full"
      >
        {Object.keys(CURRENCIES).map((currencyCode) => (
          <option key={currencyCode} value={currencyCode}>
            {getCurrencySymbol(currencyCode)} {getCurrencyName(currencyCode, locale)}
          </option>
        ))}
      </Select>
      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
        {locale === 'he' 
          ? 'כל הסכומים יוצגו במטבע הנבחר' 
          : 'All amounts will be displayed in the selected currency'}
      </p>
    </div>
  )
}

