'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const showLoading = useCallback((message = '') => {
    setLoadingMessage(message)
    setLoading(true)
  }, [])

  const hideLoading = useCallback(() => {
    setLoading(false)
    setLoadingMessage('')
  }, [])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, loading }}>
      {children}
      <LoadingOverlay isVisible={loading} message={loadingMessage} />
    </LoadingContext.Provider>
  )
}

// Default values for SSR
const defaultLoadingValue = {
  showLoading: () => {},
  hideLoading: () => {},
  loading: false,
}

export function useLoading() {
  const context = useContext(LoadingContext)
  // Return default values if context is not available (SSR)
  if (!context) {
    return defaultLoadingValue
  }
  return context
}

