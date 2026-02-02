'use client'

import { cn } from '@/lib/utils'

// Status colors
const statusColors = {
  default: 'bg-light-accent dark:bg-dark-accent',
  success: 'bg-light-success dark:bg-dark-success',
  warning: 'bg-light-warning dark:bg-dark-warning',
  danger: 'bg-light-danger dark:bg-dark-danger',
  gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
}

// Track colors
const trackColors = {
  default: 'bg-light-surface dark:bg-dark-surface',
  light: 'bg-light-border-light dark:bg-dark-border-light',
  elevated: 'bg-light-elevated dark:bg-dark-elevated',
}

export function ProgressBar({
  value = 0,
  max = 100,
  status = 'default',
  track = 'default',
  size = 'md',
  showValue = false,
  animated = false,
  className,
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className={cn(
        'w-full rounded-full overflow-hidden',
        trackColors[track],
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            statusColors[status],
            animated && 'animate-pulse-soft'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {showValue && (
        <div className="flex justify-between mt-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary tabular-nums">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

// Multi-segment progress bar for budget categories
export function SegmentedProgressBar({
  segments = [], // [{ value: number, color?: string, label?: string }]
  max = 100,
  size = 'md',
  className,
  ...props
}) {
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className={cn(
        'w-full rounded-full overflow-hidden bg-light-surface dark:bg-dark-surface flex',
        sizeClasses[size]
      )}>
        {segments.map((segment, index) => {
          const percentage = Math.min(100, Math.max(0, (segment.value / max) * 100))
          return (
            <div
              key={index}
              className={cn(
                'h-full transition-all duration-500 ease-out',
                segment.color || statusColors.default,
                index === 0 && 'rounded-s-full',
                index === segments.length - 1 && 'rounded-e-full'
              )}
              style={{ width: `${percentage}%` }}
              title={segment.label}
            />
          )
        })}
      </div>
    </div>
  )
}

// Circular progress (for goals)
export function CircularProgress({
  value = 0,
  max = 100,
  size = 'md',
  strokeWidth = 4,
  status = 'default',
  showValue = true,
  children,
  className,
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const sizeValues = {
    sm: 48,
    md: 64,
    lg: 80,
    xl: 96,
  }
  
  const dimension = sizeValues[size] || sizeValues.md
  const radius = (dimension - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const strokeColors = {
    default: '#3B82F6', // blue-500
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    danger: '#EF4444', // red-500
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-light-surface dark:text-dark-surface"
        />
        
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={strokeColors[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content */}
      {(showValue || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary tabular-nums">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
