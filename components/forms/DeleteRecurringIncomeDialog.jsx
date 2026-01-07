'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { Trash2, X } from 'lucide-react'

export function DeleteRecurringIncomeDialog({ 
  isOpen, 
  onClose, 
  onDelete,
  onDeleteWithTransactions,
  recurringIncomeDescription
}) {
  const { t } = useI18n()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.deleteRecurringIncomeTitle')} size="md">
      <div className="space-y-4">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {t('settings.deleteRecurringIncomeMessage', { description: recurringIncomeDescription })}
        </p>

        <div className="bg-light-warning-light dark:bg-dark-warning-light rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                {t('settings.deleteOption1Title')}
              </h4>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('settings.deleteOption1Desc')}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              onDeleteWithTransactions()
              onClose()
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('settings.deleteCompletely')}
          </Button>
        </div>

        <div className="bg-light-accent-light dark:bg-dark-accent-light rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                {t('settings.deleteOption2Title')}
              </h4>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('settings.deleteOption2Desc')}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            <X className="w-4 h-4 mr-2" />
            {t('settings.removeOnly')}
          </Button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

