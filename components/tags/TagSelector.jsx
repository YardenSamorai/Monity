'use client'

import { useState, useEffect } from 'react'
import { TagBadge } from './TagBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, X } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

const TAG_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function TagSelector({ transactionId, selectedTags = [], onTagsChange }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [tags, setTags] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tag')
      }

      const { tag } = await response.json()
      setTags([...tags, tag])
      setNewTagName('')
      setIsCreateModalOpen(false)
      toast.success(t('tags.created'), t('tags.createdSuccess'))
    } catch (error) {
      toast.error(t('tags.createFailed'), error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async (tagId) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add tag')
      }

      const { transactionTag } = await response.json()
      onTagsChange([...selectedTags, tags.find(t => t.id === tagId)])
    } catch (error) {
      toast.error(t('tags.addFailed'), error.message)
    }
  }

  const handleRemoveTag = async (tagId) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove tag')
      }

      onTagsChange(selectedTags.filter(t => t.id !== tagId))
    } catch (error) {
      toast.error(t('tags.removeFailed'), error.message)
    }
  }

  const availableTags = tags.filter(t => !selectedTags.find(st => st.id === t.id))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {selectedTags.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={handleRemoveTag}
          />
        ))}
        {availableTags.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddTag(e.target.value)
                e.target.value = ''
              }
            }}
            className="text-xs px-2 py-1 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary"
          >
            <option value="">{t('tags.addTag')}</option>
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs px-2 py-1 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-elevated dark:hover:bg-dark-elevated flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          {t('tags.createNew')}
        </button>
      </div>

      {/* Create Tag Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setNewTagName('')
        }}
        title={t('tags.createTag')}
      >
        <div className="space-y-4">
          <Input
            label={t('tags.tagName')}
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t('tags.tagNamePlaceholder')}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              {t('tags.color')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    newTagColor === color ? 'border-light-text-primary dark:border-dark-text-primary scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewTagName('')
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || loading}
              loading={loading}
            >
              {t('tags.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

