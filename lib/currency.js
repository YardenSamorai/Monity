/**
 * Currency utilities for multi-currency support
 */

// Common currencies with symbols
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', nameHe: 'דולר אמריקאי' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', nameHe: 'שקל ישראלי' },
  EUR: { symbol: '€', name: 'Euro', nameHe: 'אירו' },
  GBP: { symbol: '£', name: 'British Pound', nameHe: 'לירה שטרלינג' },
  JPY: { symbol: '¥', name: 'Japanese Yen', nameHe: 'ין יפני' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', nameHe: 'דולר קנדי' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', nameHe: 'דולר אוסטרלי' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', nameHe: 'פרנק שוויצרי' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', nameHe: 'יואן סיני' },
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency) {
  return CURRENCIES[currency]?.symbol || currency
}

/**
 * Get currency name
 */
export function getCurrencyName(currency, locale = 'en') {
  const currencyData = CURRENCIES[currency]
  if (!currencyData) return currency
  
  return locale === 'he' ? currencyData.nameHe : currencyData.name
}

/**
 * Convert amount from one currency to another using exchange rate
 */
export function convertCurrency(amount, fromCurrency, toCurrency, exchangeRate) {
  if (fromCurrency === toCurrency) return amount
  if (!exchangeRate) return amount // No rate available, return original
  
  return Number(amount) * Number(exchangeRate)
}

/**
 * Format amount with currency symbol
 */
export function formatCurrencyAmount(amount, currency, locale = 'en-US') {
  const symbol = getCurrencySymbol(currency)
  const absAmount = Math.abs(amount)
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount)
  
  const isNegative = amount < 0
  const isRTL = locale.startsWith('he')
  
  if (isRTL) {
    return isNegative ? `\u200E-${formatted} ${symbol}` : `${formatted} ${symbol}`
  } else {
    return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`
  }
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies() {
  return Object.keys(CURRENCIES)
}

