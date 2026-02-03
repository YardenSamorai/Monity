'use client'

import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { UserPlus, Plus, Minus, Users } from 'lucide-react'

export function FamilyHeader({ 
  household, 
  onInvite, 
  onAddIncome, 
  onAddExpense 
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                {household.name}
              </h1>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('family.membersCount', { count: household.members.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onInvite}
            className="flex-1 sm:flex-initial"
          >
            <UserPlus className="w-4 h-4 me-2" />
            {t('family.inviteMember')}
          </Button>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[rgb(var(--text-secondary))] text-sm">
        {t('family.manageHouseholdFinances')}
      </p>
    </div>
  )
}
