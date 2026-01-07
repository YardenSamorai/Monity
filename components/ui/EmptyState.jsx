'use client'

import { Button } from './Button'

export function EmptyState({ icon, title, description, action, actionLabel, actionVariant }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-light-surface dark:bg-dark-surface flex items-center justify-center mb-4 text-light-text-tertiary dark:text-dark-text-tertiary">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action} variant={actionVariant}>{actionLabel}</Button>
      )}
    </div>
  )
}

