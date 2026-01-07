'use client'

import { cn } from '@/lib/utils'

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-light-elevated dark:bg-dark-elevated',
        'border border-light-border dark:border-dark-border',
        'rounded-2xl p-6',
        'shadow-soft',
        'transition-all duration-200',
        hover && 'hover:shadow-soft-lg hover:border-light-text-tertiary dark:hover:border-dark-border-light',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-light-elevated/80 dark:bg-dark-elevated/80',
        'backdrop-blur-xl',
        'border border-light-border/50 dark:border-dark-border/50',
        'rounded-2xl p-6',
        'shadow-glass',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Premium Apple-style KPI Card
export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default', // 'default' | 'income' | 'expense' | 'balance' | 'net'
  trend,
  action, 
  className, 
  onClick 
}) {
  const variants = {
    default: {
      iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800',
      iconColor: 'text-gray-600 dark:text-gray-300',
      glow: '',
      accent: 'bg-gray-500',
    },
    balance: {
      iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
      accent: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    },
    income: {
      iconBg: 'bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
      accent: 'bg-gradient-to-r from-emerald-500 to-green-500',
    },
    expense: {
      iconBg: 'bg-gradient-to-br from-rose-100 to-red-200 dark:from-rose-900/50 dark:to-red-900/50',
      iconColor: 'text-rose-600 dark:text-rose-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
      accent: 'bg-gradient-to-r from-rose-500 to-red-500',
    },
    net: {
      iconBg: 'bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/50 dark:to-purple-900/50',
      iconColor: 'text-violet-600 dark:text-violet-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
      accent: 'bg-gradient-to-r from-violet-500 to-purple-500',
    },
    netNegative: {
      iconBg: 'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/50 dark:to-amber-900/50',
      iconColor: 'text-orange-600 dark:text-orange-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]',
      accent: 'bg-gradient-to-r from-orange-500 to-amber-500',
    },
  }

  const v = variants[variant] || variants.default

  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-light-elevated dark:bg-dark-elevated',
        'border border-light-border/60 dark:border-dark-border/60',
        'rounded-3xl p-5 sm:p-6',
        'shadow-sm hover:shadow-xl',
        'transition-all duration-500 ease-out',
        v.glow,
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none" />
      
      {/* Accent line at top */}
      <div className={cn('absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity', v.accent)} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            'shadow-sm',
            'transition-transform duration-300 group-hover:scale-110',
            v.iconBg
          )}>
            <span className={cn('transition-colors', v.iconColor)}>
              {icon}
            </span>
          </div>
          
          {trend !== undefined && (
            <div className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              trend >= 0 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
            )}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        {/* Title */}
        <p className="text-sm font-medium text-light-text-tertiary dark:text-dark-text-tertiary mb-2 tracking-wide uppercase">
          {title}
        </p>
        
        {/* Value - the hero */}
        <div className="mb-1" dir="ltr">
          <span className={cn(
            'text-3xl sm:text-4xl font-bold tracking-tight',
            'text-light-text-primary dark:text-dark-text-primary',
            'transition-all duration-300'
          )}>
            {value}
          </span>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            {subtitle}
          </p>
        )}
        
        {/* Action */}
        {action && (
          <div className="mt-4 pt-3 border-t border-light-border/50 dark:border-dark-border/50">
            {action}
          </div>
        )}
      </div>
      
      {/* Hover indicator for clickable cards */}
      {onClick && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className={cn('w-5 h-5', v.iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}

// Keep the old StatCard for backward compatibility
export function StatCard({ title, value, subtitle, trend, icon, action, className, onClick }) {
  return (
    <KPICard
      title={title}
      value={value}
      subtitle={subtitle}
      trend={trend}
      icon={icon}
      action={action}
      className={className}
      onClick={onClick}
    />
  )
}
