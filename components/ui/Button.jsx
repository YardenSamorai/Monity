'use client'

import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-light-accent dark:bg-dark-accent text-white hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover shadow-soft',
  secondary: 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:bg-light-border-light dark:hover:bg-dark-border-light',
  ghost: 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface',
  destructive: 'bg-light-danger dark:bg-dark-danger text-white hover:bg-light-danger-dark dark:hover:bg-dark-danger-dark shadow-soft',
  success: 'bg-light-success dark:bg-dark-success text-white hover:bg-light-success-dark dark:hover:bg-dark-success-dark shadow-soft',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-dark-bg',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-dark-bg',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

