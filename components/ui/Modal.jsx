'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      document.body.style.overflow = 'hidden'
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      document.body.style.overflow = 'unset'
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!shouldRender) return null

  const sizes = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Mobile: Bottom Sheet / Desktop: Centered Dialog */}
      <div className={cn(
        // Mobile: Bottom sheet positioning
        "fixed left-0 right-0 bottom-0 top-auto",
        // Desktop: Full screen flex container for centering
        "md:top-0 md:bottom-0 md:left-0 md:right-0 md:flex md:items-center md:justify-center md:p-6"
      )}>
        <div
          className={cn(
            'relative bg-[rgb(var(--bg-secondary))] shadow-xl',
            'border border-[rgb(var(--border-primary))]',
            // Mobile: Full width bottom sheet with top rounded corners
            'w-full rounded-t-2xl',
            // Desktop: Centered dialog with all rounded corners, proper width
            'md:rounded-xl md:w-full',
            sizes[size],
            // Height constraints
            'max-h-[90vh] md:max-h-[85vh]',
            'overflow-hidden flex flex-col',
            // Animation
            'transition-all duration-300 ease-out',
            // Mobile: Slide up from bottom
            isAnimating 
              ? 'translate-y-0' 
              : 'translate-y-full',
            // Desktop: Fade + scale (override mobile translate)
            'md:translate-y-0',
            isAnimating 
              ? 'md:opacity-100 md:scale-100' 
              : 'md:opacity-0 md:scale-95'
          )}
        >
          {/* Drag Handle - Mobile Only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[rgb(var(--border-primary))]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 md:py-4 border-b border-[rgb(var(--border-primary))]">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {title}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 -me-2 rounded-full text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4 pb-safe min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
