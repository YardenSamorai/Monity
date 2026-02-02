'use client'

import { cn } from '@/lib/utils'

// Base Card - Clean, minimal
export function Card({ children, className, hover = false, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-secondary))]',
        'border border-[rgb(var(--border-primary))]',
        'rounded-lg',
        'shadow-[var(--shadow-sm)]',
        padding && 'p-4',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// KPI Card - Numbers focused, minimal
export function KPICard({ 
  label, 
  value, 
  subtitle, 
  trend,
  trendDirection, // 'up' | 'down' | 'neutral'
  className,
  valueClassName,
}) {
  return (
    <Card className={cn('p-4 lg:p-5', className)} padding={false}>
      <div className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
        {label}
      </div>
      <div 
        className={cn(
          'text-2xl lg:text-3xl font-semibold tracking-tight tabular-nums text-[rgb(var(--text-primary))]',
          valueClassName
        )}
        dir="ltr"
      >
        {value}
      </div>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1">
          {subtitle && (
            <span className="text-xs text-[rgb(var(--text-tertiary))]">
              {subtitle}
            </span>
          )}
          {trend !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              trendDirection === 'up' && 'text-positive',
              trendDirection === 'down' && 'text-negative',
              trendDirection === 'neutral' && 'text-[rgb(var(--text-tertiary))]'
            )}>
              {trendDirection === 'up' && '↑'}
              {trendDirection === 'down' && '↓'}
              {trend}%
            </span>
          )}
        </div>
      )}
    </Card>
  )
}

// Stat Card - Legacy support
export function StatCard({ title, value, subtitle, trend, icon, className, onClick }) {
  return (
    <Card 
      className={cn('p-4 lg:p-5', className)} 
      padding={false}
      hover={!!onClick}
      onClick={onClick}
    >
      <div className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
        {title}
      </div>
      <div className="text-2xl lg:text-3xl font-semibold tracking-tight tabular-nums text-[rgb(var(--text-primary))]" dir="ltr">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {subtitle}
        </div>
      )}
    </Card>
  )
}

// Section Card
export function SectionCard({ title, action, children, className }) {
  return (
    <div className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <Card padding={false}>
        {children}
      </Card>
    </div>
  )
}

// Progress Card for budgets
export function ProgressCard({
  title,
  current,
  target,
  percentage,
  status = 'default', // 'default' | 'warning' | 'danger'
  className,
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'danger': return 'bg-[rgb(var(--negative))]'
      case 'warning': return 'bg-[rgb(var(--warning))]'
      default: return 'bg-[rgb(var(--accent))]'
    }
  }

  const safePercentage = Math.min(100, Math.max(0, percentage || 0))

  return (
    <Card className={cn('p-4', className)} padding={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-[rgb(var(--text-primary))]">{title}</span>
        <span className={cn(
          'text-sm font-semibold',
          status === 'danger' && 'text-negative',
          status === 'warning' && 'text-warning',
          status === 'default' && 'text-[rgb(var(--text-primary))]'
        )}>
          {safePercentage.toFixed(0)}%
        </span>
      </div>
      <div className="progress-track">
        <div 
          className={cn('progress-fill', getStatusColor())}
          style={{ width: `${safePercentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-[rgb(var(--text-tertiary))]">
        <span dir="ltr">{current}</span>
        <span dir="ltr">{target}</span>
      </div>
    </Card>
  )
}
