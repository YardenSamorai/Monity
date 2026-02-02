'use client'

import { Spinner } from './Spinner'

export function LoadingOverlay({ isVisible, message }) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm">
      <div className="bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-lg flex flex-col items-center gap-4 min-w-[200px]">
        <Spinner size="lg" variant="primary" />
        {message && (
          <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

