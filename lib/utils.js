import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind classes with proper conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency with locale and currency support
 * If no symbol provided, uses global currency from i18n context
 */
export function formatCurrency(amount, options = {}) {
  // Get global currency from localStorage if available (client-side)
  let globalCurrency = 'USD'
  let globalSymbol = null
  if (typeof window !== 'undefined') {
    const savedCurrency = localStorage.getItem('currency')
    if (savedCurrency) {
      globalCurrency = savedCurrency
      // Import currency utilities dynamically to avoid SSR issues
      try {
        const { getCurrencySymbol } = require('./currency')
        globalSymbol = getCurrencySymbol(globalCurrency)
      } catch (e) {
        // Fallback if currency module not available
      }
    }
  }

  const {
    currency = globalCurrency,
    locale = 'en-US',
    symbol = globalSymbol || null, // Use global symbol if available, otherwise custom symbol
  } = options

  // If custom symbol provided, format manually for better control
  if (symbol) {
    // Always use en-US for number formatting to avoid RTL issues with minus sign
    const absAmount = Math.abs(amount)
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absAmount)
    
    const isNegative = amount < 0
    const isRTL = locale.startsWith('he')
    
    // Always put minus sign on the left side, before everything
    // Use Unicode Left-to-Right Mark (LRM) to force LTR for the minus sign
    if (isRTL) {
      // For RTL: -מספר סמל (minus number symbol) - minus always on the left
      // Use LRM to ensure minus appears on the left even in RTL context
      return isNegative ? `\u200E-${formatted} ${symbol}` : `${formatted} ${symbol}`
    } else {
      // For LTR: -symbolnumber (minus symbol number) - minus always on the left
      return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`
    }
  }

  // Standard currency formatting
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  
  // For standard formatting, ensure minus is on the left
  // Some locales might put minus on the right, so we normalize it
  if (amount < 0 && formatted.includes('-')) {
    // If minus is at the end, move it to the beginning
    if (formatted.endsWith('-')) {
      return `-${formatted.slice(0, -1)}`
    }
  }
  
  return formatted
}

/**
 * Format date with locale support
 */
export function formatDate(date, format = 'short', locale = 'en-US') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
  }
  
  if (format === 'month') {
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }
  
  return d.toLocaleDateString(locale)
}

/**
 * Format number with locale support
 */
export function formatNumber(number, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number)
}

/**
 * Get start and end of month
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Get billing-cycle-aware month range based on user's monthStartDay.
 * If monthStartDay=1 this is identical to a calendar month.
 * If monthStartDay=10 and reference month is March 2026:
 *   start = March 10, end = April 9 23:59:59.999
 *
 * @param {number} year  - reference year
 * @param {number} month - reference month (1-indexed, 1=Jan)
 * @param {number} monthStartDay - day of month the billing cycle starts (1-28)
 */
export function getBillingCycleRange(year, month, monthStartDay = 1) {
  if (monthStartDay <= 1) {
    return getMonthRange(year, month)
  }
  const start = new Date(year, month - 1, monthStartDay)
  const end = new Date(year, month, monthStartDay - 1, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Get the billing-cycle month that contains a given date.
 * Returns { year, month } where month is 1-indexed.
 */
export function getBillingCycleForDate(date, monthStartDay = 1) {
  const d = new Date(date)
  let year = d.getFullYear()
  let month = d.getMonth() + 1 // 1-indexed
  if (monthStartDay > 1 && d.getDate() < monthStartDay) {
    month -= 1
    if (month < 1) { month = 12; year -= 1 }
  }
  return { year, month }
}

/**
 * Generate API token
 */
export function generateApiToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `monity_${token}`
}

/**
 * Convert Prisma Decimal objects to plain numbers for Client Components
 * Uses JSON.stringify with a custom replacer to handle Decimals, Dates, and other special types
 */
export function serializePrismaData(data) {
  if (data === null || data === undefined) {
    return data
  }
  
  // Custom replacer function for JSON.stringify
  const replacer = (key, value) => {
    // Handle Prisma Decimal objects
    if (value && typeof value === 'object' && value.constructor) {
      // Check for Decimal by looking for toNumber method or Decimal structure
      if (typeof value.toNumber === 'function' || 
          value.constructor.name === 'Decimal' ||
          (value.d !== undefined && value.e !== undefined && value.s !== undefined)) {
        try {
          return typeof value.toNumber === 'function' ? value.toNumber() : Number(value)
        } catch {
          return Number(value) || 0
        }
      }
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString()
    }
    
    // Handle BigInt (if any)
    if (typeof value === 'bigint') {
      return Number(value)
    }
    
    // Remove functions (they can't be serialized)
    if (typeof value === 'function') {
      return undefined
    }
    
    return value
  }
  
  try {
    return JSON.parse(JSON.stringify(data, replacer))
  } catch (error) {
    console.error('Error serializing Prisma data:', error)
    // Fallback: try to convert manually
    return data
  }
}

