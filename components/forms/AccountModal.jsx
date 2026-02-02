'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { CURRENCIES, getCurrencySymbol, getCurrencyName } from '@/lib/currency'

export function AccountModal({ isOpen, onClose, onSuccess, editingAccount = null }) {
  const { toast } = useToast()
  const { t, currency: globalCurrency, locale } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '0',
    currency: globalCurrency || 'USD',
    isActive: true,
  })

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: String(editingAccount.balance),
        currency: editingAccount.currency || globalCurrency || 'USD',
        isActive: editingAccount.isActive,
      })
    } else {
      setFormData({
        name: '',
        type: 'bank',
        balance: '0',
        currency: globalCurrency || 'USD',
        isActive: true,
      })
    }
  }, [editingAccount, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingAccount 
        ? `/api/accounts/${editingAccount.id}`
        : '/api/accounts'
      const method = editingAccount ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          balance: editingAccount ? undefined : parseFloat(formData.balance), // Don't update balance when editing
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${editingAccount ? 'update' : 'create'} account`)
      }

      toast.success(
        editingAccount ? t('settings.accountUpdated') : t('settings.accountCreated'),
        editingAccount ? t('settings.accountUpdatedDesc') : t('settings.accountCreatedDesc')
      )
      onSuccess?.()
      onClose()
      
      // Reset form if not editing
      if (!editingAccount) {
        setFormData({
          name: '',
          type: 'bank',
          balance: '0',
          currency: globalCurrency || 'USD',
          isActive: true,
        })
      }
    } catch (error) {
      console.error(`Error ${editingAccount ? 'updating' : 'creating'} account:`, error)
      toast.error(
        editingAccount ? t('settings.accountUpdateFailed') : t('settings.accountCreateFailed'),
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
      title={editingAccount ? t('settings.editAccount') : t('settings.addAccount')} 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('settings.accountName')}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('settings.accountNamePlaceholder')}
          required
        />

        <Select
          label={t('settings.accountType')}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="bank">{t('settings.bank')}</option>
          <option value="cash">{t('settings.cash')}</option>
          <option value="credit">{t('settings.credit')}</option>
        </Select>

        {!editingAccount && (
          <Input
            label={t('settings.initialBalance')}
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            placeholder="0.00"
            required
          />
        )}

        <Select
          label={t('settings.currency')}
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          {Object.keys(CURRENCIES).map((currencyCode) => (
            <option key={currencyCode} value={currencyCode}>
              {getCurrencySymbol(currencyCode)} {getCurrencyName(currencyCode, locale)}
            </option>
          ))}
        </Select>

        {editingAccount && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-light-border dark:border-dark-border"
            />
            <label htmlFor="isActive" className="text-sm text-light-text-primary dark:text-dark-text-primary">
              {t('settings.active')}
            </label>
          </div>
        )}

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
              : (editingAccount ? t('settings.updateAccount') : t('settings.addAccount'))
            }
          </Button>
        </div>
      </form>
    </Modal>
  )
}

