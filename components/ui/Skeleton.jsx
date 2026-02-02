'use client'

import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg',
        'bg-gradient-to-r from-light-surface via-light-border-light to-light-surface',
        'dark:from-dark-surface dark:via-dark-border dark:to-dark-surface',
        className
      )}
      {...props}
    />
  )
}

// Skeleton for text lines
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// Skeleton for KPI cards
export function SkeletonKPI({ className }) {
  return (
    <div className={cn(
      'bg-light-elevated dark:bg-dark-elevated',
      'border border-light-border dark:border-dark-border',
      'rounded-2xl p-5 sm:p-6',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// Skeleton for transaction rows
export function SkeletonTransaction({ className }) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4',
      className
    )}>
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

// Skeleton for cards
export function SkeletonCard({ className }) {
  return (
    <div className={cn(
      'bg-light-elevated dark:bg-dark-elevated',
      'border border-light-border dark:border-dark-border',
      'rounded-2xl p-6',
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )
}

// Skeleton for list items
export function SkeletonList({ count = 5, className }) {
  return (
    <div className={cn('divide-y divide-light-border/50 dark:divide-dark-border/50', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTransaction key={i} />
      ))}
    </div>
  )
}
