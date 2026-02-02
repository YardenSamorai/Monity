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
        // Mobile: Bottom sheet
        "fixed inset-x-0 bottom-0 md:inset-auto",
        // Desktop: Centered
        "md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
        "md:p-4"
      )}>
        <div
          className={cn(
            'relative w-full bg-[rgb(var(--bg-secondary))] shadow-xl',
            'border border-[rgb(var(--border-primary))]',
            // Mobile: Full width bottom sheet with top rounded corners
            'rounded-t-2xl md:rounded-xl',
            // Mobile: Max height with safe area
            'max-h-[90vh] md:max-h-[85vh]',
            'overflow-hidden flex flex-col',
            // Desktop sizes
            sizes[size],
            // Animation
            'transition-transform duration-300 ease-out',
            // Mobile: Slide up from bottom
            isAnimating 
              ? 'translate-y-0 md:translate-y-0' 
              : 'translate-y-full md:translate-y-8 md:opacity-0'
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
          <div className="flex-1 overflow-y-auto px-5 py-4 pb-safe">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
