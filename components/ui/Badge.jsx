'use client'

import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary border border-light-border dark:border-dark-border',
  success: 'bg-light-success-light dark:bg-dark-success-light text-light-success-dark dark:text-dark-success',
  warning: 'bg-light-warning-light dark:bg-dark-warning-light text-light-warning-dark dark:text-dark-warning',
  danger: 'bg-light-danger-light dark:bg-dark-danger-light text-light-danger-dark dark:text-dark-danger',
  accent: 'bg-light-accent-light dark:bg-dark-accent-light text-light-accent dark:text-dark-accent',
}

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

