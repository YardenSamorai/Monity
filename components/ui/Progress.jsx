'use client'

import { cn } from '@/lib/utils'

export function Progress({ value = 0, max = 100, className, showLabel = false }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const getColor = () => {
    if (percentage >= 100) return 'bg-light-danger dark:bg-dark-danger'
    if (percentage >= 80) return 'bg-light-warning dark:bg-dark-warning'
    return 'bg-light-success dark:bg-dark-success'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-light-text-secondary dark:text-dark-text-secondary">
            {value.toFixed(0)} / {max.toFixed(0)}
          </span>
          <span className={cn(
            'font-medium',
            percentage >= 100 ? 'text-light-danger dark:text-dark-danger' :
            percentage >= 80 ? 'text-light-warning dark:text-dark-warning' :
            'text-light-success dark:text-dark-success'
          )}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className="h-2 bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

