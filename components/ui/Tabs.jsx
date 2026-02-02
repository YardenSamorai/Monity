'use client'

import { cn } from '@/lib/utils'

export function Tabs({ tabs, activeTab, onTabChange, className }) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 lg:mx-0 lg:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-[rgb(var(--accent))] text-white'
                : 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))]'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))]'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TabPanel({ children, active, id }) {
  if (!active) return null
  return (
    <div id={`tab-panel-${id}`} role="tabpanel" className="animate-fade-in">
      {children}
    </div>
  )
}
