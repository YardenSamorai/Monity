'use client'

import { Modal } from './Modal'
import { Button } from './Button'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-lg bg-negative-subtle flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-negative" />
            </div>
          )}
          <p className="text-[rgb(var(--text-secondary))] text-sm pt-2">
            {message}
          </p>
        </div>
        
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
