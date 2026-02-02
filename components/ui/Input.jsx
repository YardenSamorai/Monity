'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input(
  { className, label, error, hint, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full h-10 px-3 rounded-md',
          'bg-[rgb(var(--bg-secondary))]',
          'border border-[rgb(var(--border-primary))]',
          'text-[rgb(var(--text-primary))]',
          'placeholder:text-[rgb(var(--text-tertiary))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30 focus:border-[rgb(var(--accent))]',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-[rgb(var(--negative))] focus:ring-[rgb(var(--negative))]/30 focus:border-[rgb(var(--negative))]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-negative">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{hint}</p>
      )}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { className, label, error, hint, children, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full h-10 px-3 rounded-md appearance-none cursor-pointer',
          'bg-[rgb(var(--bg-secondary))]',
          'border border-[rgb(var(--border-primary))]',
          'text-[rgb(var(--text-primary))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30 focus:border-[rgb(var(--accent))]',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")] bg-no-repeat bg-[right_8px_center] bg-[length:16px_16px] pe-8',
          error && 'border-[rgb(var(--negative))]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-negative">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{hint}</p>
      )}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { className, label, error, hint, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-md resize-none',
          'bg-[rgb(var(--bg-secondary))]',
          'border border-[rgb(var(--border-primary))]',
          'text-[rgb(var(--text-primary))]',
          'placeholder:text-[rgb(var(--text-tertiary))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30 focus:border-[rgb(var(--accent))]',
          'transition-colors duration-150',
          error && 'border-[rgb(var(--negative))]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-negative">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{hint}</p>
      )}
    </div>
  )
})

export function Toggle({ className, label, checked, onChange, ...props }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors duration-200',
          checked 
            ? 'bg-[rgb(var(--accent))]' 
            : 'bg-[rgb(var(--border-primary))]',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
            checked ? 'start-[18px]' : 'start-0.5'
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-[rgb(var(--text-primary))]">{label}</span>
      )}
    </label>
  )
}
