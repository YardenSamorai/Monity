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

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

