'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Filter } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

export function AdvancedFilters({ onApply, onClear, accounts, categories }) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    accountId: '',
    categoryId: '',
    search: '',
  })

  const handleApply = () => {
    onApply(filters)
    setIsOpen(false)
  }

  const handleClear = () => {
    const cleared = {
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      accountId: '',
      categoryId: '',
      search: '',
    }
    setFilters(cleared)
    onClear()
    setIsOpen(false)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
          hasActiveFilters
            ? 'bg-light-accent/10 dark:bg-dark-accent/10 border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent'
            : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-elevated dark:hover:bg-dark-elevated'
        )}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">{t('filters.advancedFilters')}</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-light-accent dark:bg-dark-accent" />
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('filters.advancedFilters')}
        size="md"
      >
        <div className="p-6 space-y-4">
          <Input
            label={t('filters.search')}
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('filters.searchPlaceholder')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('filters.startDate')}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              label={t('filters.endDate')}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('filters.minAmount')}
              type="number"
              step="0.01"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label={t('filters.maxAmount')}
              type="number"
              step="0.01"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Select
            label={t('transactions.filterByAccount')}
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          >
            <option value="">{t('filters.allAccounts')}</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>

          <Select
            label={t('transactions.category')}
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">{t('filters.allCategories')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleClear}
            >
              {t('filters.clear')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
            >
              {t('filters.apply')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

