'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = toastId++
    setToasts(prev => [...prev, { id, title, description, variant, duration }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ title: options })
    }
    return addToast(options)
  }, [addToast])

  toast.success = useCallback((title, description) => 
    addToast({ title, description, variant: 'success' }), [addToast])
  
  toast.error = useCallback((title, description) => 
    addToast({ title, description, variant: 'error' }), [addToast])
  
  toast.warning = useCallback((title, description) => 
    addToast({ title, description, variant: 'warning' }), [addToast])
  
  toast.info = useCallback((title, description) => 
    addToast({ title, description, variant: 'info' }), [addToast])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Default values for SSR
const noopToast = () => {}
noopToast.success = () => {}
noopToast.error = () => {}
noopToast.warning = () => {}
noopToast.info = () => {}

const defaultToastValue = {
  toast: noopToast,
  removeToast: () => {},
}

export function useToast() {
  const context = useContext(ToastContext)
  // Return default values if context is not available (SSR)
  if (!context) {
    return defaultToastValue
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  const { isRTL } = useI18n()
  
  if (toasts.length === 0) return null

  return (
    <div className={cn(
      "fixed z-[100] flex flex-col gap-2",
      // Mobile: centered at top, below header
      "top-16 left-4 right-4 mx-auto max-w-[calc(100%-2rem)]",
      // Desktop: bottom corner
      "sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 sm:mx-0 sm:max-w-sm sm:w-full",
      // RTL support for desktop
      isRTL && "sm:right-auto sm:left-4"
    )}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ title, description, variant, onClose }) {
  const variants = {
    default: {
      icon: <Info className="w-5 h-5" />,
      containerClass: 'bg-[rgb(var(--bg-secondary))] border-[rgb(var(--border-primary))]',
      iconClass: 'text-[rgb(var(--text-secondary))]',
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      containerClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      containerClass: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
      iconClass: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      containerClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      containerClass: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = variants[variant] || variants.default

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 sm:p-4 rounded-xl border shadow-lg",
        "backdrop-blur-xl animate-slide-up",
        config.containerClass
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", config.iconClass)}>
        {config.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[rgb(var(--text-primary))] text-sm sm:text-base leading-tight">
          {title}
        </div>
        {description && (
          <div className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-target"
      >
        <X className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      </button>
    </div>
  )
}

