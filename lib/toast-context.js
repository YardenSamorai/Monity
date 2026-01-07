'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

const ToastContext = createContext({})

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

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  const { isRTL } = useI18n()
  
  if (toasts.length === 0) return null

  return (
    <div className={cn(
      "fixed bottom-20 lg:bottom-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 lg:px-0",
      isRTL ? "left-4" : "right-4"
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
      className: 'bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border',
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      className: 'bg-light-success-light dark:bg-dark-success-light border-light-success dark:border-dark-success',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      className: 'bg-light-danger-light dark:bg-dark-danger-light border-light-danger dark:border-dark-danger',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      className: 'bg-light-warning-light dark:bg-dark-warning-light border-light-warning dark:border-dark-warning',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      className: 'bg-light-accent-light dark:bg-dark-accent-light border-light-accent dark:border-dark-accent',
    },
  }

  const config = variants[variant] || variants.default

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-2xl border shadow-glass backdrop-blur-xl
        animate-slide-up
        ${config.className}
      `}
    >
      <div className="text-light-text-primary dark:text-dark-text-primary flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-light-text-primary dark:text-dark-text-primary mb-0.5">
          {title}
        </div>
        {description && (
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {description}
          </div>
        )}
      </div>

      <IconButton
        onClick={onClose}
        variant="ghost"
        size="sm"
        className="flex-shrink-0 -mt-1"
      >
        <X className="w-4 h-4" />
      </IconButton>
    </div>
  )
}

