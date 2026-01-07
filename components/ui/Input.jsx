'use client'

import { cn } from '@/lib/utils'

export function Input({ label, error, helperText, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
          {label}
        </label>
      )}
      
      <input
        className={cn(
          'w-full h-11 px-4 rounded-xl',
          'bg-light-surface dark:bg-dark-surface',
          'border border-light-border dark:border-dark-border',
          'text-light-text-primary dark:text-dark-text-primary',
          'placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-light-danger dark:border-dark-danger focus:ring-light-danger dark:focus:ring-dark-danger',
          className
        )}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={cn(
          'text-sm',
          error ? 'text-light-danger dark:text-dark-danger' : 'text-light-text-tertiary dark:text-dark-text-tertiary'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export function Select({ label, error, helperText, className, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
          {label}
        </label>
      )}
      
      <select
        className={cn(
          'w-full h-11 px-4 rounded-xl appearance-none',
          'bg-light-surface dark:bg-dark-surface',
          'border border-light-border dark:border-dark-border',
          'text-light-text-primary dark:text-dark-text-primary',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'cursor-pointer',
          error && 'border-light-danger dark:border-dark-danger',
          className
        )}
        {...props}
      >
        {children}
      </select>
      
      {(error || helperText) && (
        <p className={cn(
          'text-sm',
          error ? 'text-light-danger dark:text-dark-danger' : 'text-light-text-tertiary dark:text-dark-text-tertiary'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

