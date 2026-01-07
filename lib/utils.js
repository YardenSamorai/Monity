/**
 * Utility to merge Tailwind classes
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Format currency with locale and currency support
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = 'USD',
    locale = 'en-US',
    symbol = null, // Optional: use custom symbol like '₪' instead of 'ILS'
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

