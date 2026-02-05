'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { 
  Settings, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Check,
  X
} from 'lucide-react'

const FAMILY_ICONS = ['👨‍👩‍👧‍👦', '👨‍👩‍👦', '👨‍👩‍👧', '🏠', '💕', '❤️', '🏡', '👪']

export function FamilySettingsCard({ household, onUpdate, onDelete, isOwner }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editName, setEditName] = useState(household?.name || '')
  const [editIcon, setEditIcon] = useState(household?.icon || '👨‍👩‍👧‍👦')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleSave = async () => {
    if (!editName.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/households/${household.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }

      toast.success(t('family.settingsUpdated'))
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      toast.error(t('family.settingsUpdateFailed'), error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== household.name) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/households/${household.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      toast.success(t('family.deleted'))
      setIsDeleteModalOpen(false)
      onDelete?.()
    } catch (error) {
      toast.error(t('family.deleteFailed'), error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(household?.name || '')
    setEditIcon(household?.icon || '👨‍👩‍👧‍👦')
    setIsEditing(false)
  }

  if (!isOwner) {
    return null
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
              </div>
              <div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                  {t('family.settings')}
                </h3>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('family.settingsDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Family Name & Icon */}
          {isEditing ? (
            <div className="space-y-4">
              {/* Icon selector */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  {t('family.icon')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FAMILY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        editIcon === icon
                          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110'
                          : 'bg-[rgb(var(--bg-secondary))] hover:bg-[rgb(var(--bg-tertiary))]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  {t('family.familyName')}
                </label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <X className="w-4 h-4 me-1" />
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!editName.trim() || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 me-1" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{household?.icon || '👨‍👩‍👧‍👦'}</span>
                <div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('family.familyName')}</p>
                  <p className="font-medium text-[rgb(var(--text-primary))]">{household?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t('family.dangerZone')}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('family.deleteWarning')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteConfirmation('')
        }}
        title={t('family.deleteFamily')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {t('family.deleteWarningTitle')}
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                {t('family.deleteWarningDescription')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-2">
              {t('family.typeToConfirm', { name: household?.name })}
            </label>
            <Input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={household?.name}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeleteConfirmation('')
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteConfirmation !== household?.name || isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 me-1" />
                  {t('family.deleteFamily')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
