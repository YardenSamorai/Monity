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
      <div className="space-y-6 pt-2">
        {/* Warning icon and message - centered layout */}
        <div className="flex flex-col items-center text-center gap-3">
          {variant === 'danger' && (
            <div className="w-12 h-12 rounded-full bg-negative-subtle flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-negative" />
            </div>
          )}
          <p className="text-[rgb(var(--text-secondary))] text-base">
            {message}
          </p>
        </div>
        
        {/* Buttons - larger and more prominent */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 text-base"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className="flex-1 h-12 text-base font-semibold"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
