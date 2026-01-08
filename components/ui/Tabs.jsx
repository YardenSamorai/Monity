'use client'

import { cn } from '@/lib/utils'

export function Tabs({ tabs, activeTab, onTabChange, className }) {
  return (
    <div className={cn(
      'flex gap-1 border-b border-light-border dark:border-dark-border mb-6 lg:mb-8',
      'overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0',
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-3 lg:px-5 py-3 lg:py-3.5 text-sm font-medium transition-all duration-200 whitespace-nowrap relative',
              'border-b-2 -mb-[1px] flex items-center gap-1.5 lg:gap-2',
              'hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 rounded-t-xl',
              'min-w-fit flex-shrink-0',
              isActive
                ? 'text-light-accent dark:text-dark-accent border-light-accent dark:border-dark-accent bg-light-surface/30 dark:bg-dark-surface/30'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary border-transparent hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-light-border dark:hover:border-dark-border'
            )}
          >
            {tab.icon && (
              <span className={cn(
                'inline-flex items-center transition-colors',
                isActive ? 'text-light-accent dark:text-dark-accent' : 'text-light-text-tertiary dark:text-dark-text-tertiary'
              )}>
                {tab.icon}
              </span>
            )}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && (
              <span className={cn(
                'px-1.5 lg:px-2 py-0.5 text-xs font-semibold rounded-full min-w-[18px] lg:min-w-[20px] text-center',
                isActive
                  ? 'bg-light-accent/20 dark:bg-dark-accent/20 text-light-accent dark:text-dark-accent'
                  : 'bg-light-surface dark:bg-dark-surface text-light-text-tertiary dark:text-dark-text-tertiary'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ children, active, id }) {
  if (!active) return null
  return <div id={id}>{children}</div>
}
