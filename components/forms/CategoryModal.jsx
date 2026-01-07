'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
]

export function CategoryModal({ isOpen, onClose, onSuccess, editingCategory = null, defaultType = 'expense' }) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: defaultType,
    color: '#3B82F6',
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        type: editingCategory.type,
        color: editingCategory.color,
      })
    } else {
      setFormData({
        name: '',
        type: defaultType || 'expense',
        color: '#3B82F6',
      })
    }
  }, [editingCategory, isOpen, defaultType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${editingCategory ? 'update' : 'create'} category`)
      }

      const result = await response.json()
      const category = result.category

      toast.success(
        editingCategory ? t('settings.categoryUpdated') : t('settings.categoryCreated'),
        editingCategory ? t('settings.categoryUpdatedDesc') : t('settings.categoryCreatedDesc')
      )
      onSuccess?.(category)
      onClose()
      
      // Reset form
      if (!editingCategory) {
        setFormData({
          name: '',
          type: defaultType,
          color: '#3B82F6',
        })
      }
    } catch (error) {
      console.error(`Error ${editingCategory ? 'updating' : 'creating'} category:`, error)
      toast.error(
        editingCategory ? t('settings.categoryUpdateFailed') : t('settings.categoryCreateFailed'),
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingCategory ? t('settings.editCategory') : t('settings.addCategory')} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('settings.categoryName')}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('settings.categoryNamePlaceholder')}
          required
        />

        <Select
          label={t('settings.categoryType')}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="expense">{t('settings.expense')}</option>
          <option value="income">{t('settings.income')}</option>
          <option value="both">{t('settings.both')}</option>
        </Select>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            {t('settings.color')}
          </label>
          <div className="grid grid-cols-9 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-light-accent dark:ring-dark-accent scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading 
              ? t('common.loading') 
              : (editingCategory ? t('settings.updateCategory') : t('settings.addCategory'))
            }
          </Button>
        </div>
      </form>
    </Modal>
  )
}

