'use client'

import { useI18n } from '@/lib/i18n-context'

export function TransactionsPageHeader({ transactionsCount }) {
  const { t } = useI18n()
  
  return (
    <div className="space-y-2">
      <h1 className="text-3xl lg:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">
        {t('transactions.title')}
      </h1>
      <p className="text-light-text-secondary dark:text-dark-text-secondary">
        {transactionsCount} {t('transactions.transactionsCount')}
      </p>
    </div>
  )
}

