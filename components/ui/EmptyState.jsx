'use client'

import { cn } from '@/lib/utils'
import { Button } from './Button'

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center mb-4 text-[rgb(var(--text-tertiary))]">
          {icon}
        </div>
      )}
      
      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-1">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-xs mb-5">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
