'use client'

import { cn } from '@/lib/utils'

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className 
}) {
  const variants = {
    default: 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]',
    success: 'bg-positive-subtle text-positive',
    warning: 'bg-warning-subtle text-warning',
    danger: 'bg-negative-subtle text-negative',
    destructive: 'bg-negative-subtle text-negative',
    info: 'bg-info-subtle text-info',
    primary: 'bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]',
    secondary: 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]',
  }

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded',
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-sm px-2.5 py-1 rounded-md',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
