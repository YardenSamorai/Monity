'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    ...props
  },
  ref
) {
  const variants = {
    primary: 'bg-[rgb(var(--accent))] text-white hover:opacity-90',
    secondary: 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--border-primary))]',
    ghost: 'bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--text-primary))]',
    destructive: 'bg-[rgb(var(--negative))] text-white hover:opacity-90',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-[rgb(var(--positive))] text-white hover:opacity-90',
    outline: 'bg-transparent border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]',
  }

  const sizes = {
    xs: 'h-7 px-2.5 text-xs rounded',
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-11 px-5 text-base rounded-lg',
  }

  const spinnerSizes = { xs: 'sm', sm: 'sm', md: 'sm', lg: 'md' }

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-target',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={spinnerSizes[size]} />}
      {children}
    </button>
  )
})

export function IconButton({ 
  children, 
  className, 
  variant = 'ghost',
  size = 'md',
  ...props 
}) {
  const variants = {
    ghost: 'bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--text-primary))]',
    primary: 'bg-[rgb(var(--accent))] text-white hover:opacity-90',
    destructive: 'bg-transparent text-[rgb(var(--negative))] hover:bg-[rgb(var(--negative))]/10',
  }

  const sizes = {
    sm: 'w-8 h-8 rounded-md',
    md: 'w-9 h-9 rounded-md',
    lg: 'w-10 h-10 rounded-lg',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/30',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function FAB({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'fixed bottom-20 lg:bottom-6 z-40 w-12 h-12 rounded-full',
        'bg-[rgb(var(--accent))] text-white shadow-lg',
        'flex items-center justify-center',
        'hover:opacity-90 active:scale-95 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
