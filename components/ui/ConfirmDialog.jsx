'use client'

import { Modal } from './Modal'
import { Button } from './Button'
import { useI18n } from '@/lib/i18n-context'

export function ConfirmDialog({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmLabel, 
  cancelLabel,
  onConfirm,
  variant = 'danger', // 'danger' | 'warning' | 'default'
  secondaryAction // { label, onClick }
}) {
  const { t } = useI18n()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {message}
        </p>
        
        {secondaryAction && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                secondaryAction.onClick()
                onClose()
              }}
              className="w-full text-left p-3 rounded-xl border border-light-border-light dark:border-dark-border-light hover:border-light-border dark:hover:border-dark-border transition-colors"
            >
              <div className="font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                {secondaryAction.label}
              </div>
              <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                {secondaryAction.description}
              </div>
            </button>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : variant === 'warning' ? 'default' : 'default'}
            className="flex-1"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

