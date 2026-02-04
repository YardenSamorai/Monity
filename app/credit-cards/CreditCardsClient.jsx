'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  CreditCard as CreditCardIcon,
  Plus,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Wallet,
  Clock,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react'

export function CreditCardsClient() {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  
  const [creditCards, setCreditCards] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [cardsRes, accountsRes] = await Promise.all([
        fetch('/api/credit-cards', { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' }),
      ])
      
      const cardsData = await cardsRes.json()
      const accountsData = await accountsRes.json()
      
      setCreditCards(cardsData.creditCards || [])
      setAccounts(accountsData.accounts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time updates
  useDataRefresh({
    key: 'credit-cards-page',
    fetchFn: fetchData,
    events: [
      EVENTS.CREDIT_CARD_CREATED,
      EVENTS.CREDIT_CARD_UPDATED,
      EVENTS.CREDIT_CARD_DELETED,
      EVENTS.CREDIT_CARD_TRANSACTION,
      EVENTS.CREDIT_CARD_TRANSACTION_UPDATED,
      EVENTS.CREDIT_CARD_TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const handleDelete = async (cardId) => {
    if (!confirm(t('creditCards.confirmDelete'))) return

    showLoading()
    try {
      const response = await fetch(`/api/credit-cards/${cardId}?force=true`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success(t('creditCards.deleted'))
      fetchData()
    } catch (error) {
      toast.error(t('creditCards.deleteFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  // Calculate totals
  const totalPending = creditCards.reduce((sum, card) => sum + Number(card.pendingAmount), 0)
  const totalLimit = creditCards.reduce((sum, card) => sum + Number(card.creditLimit || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {t('creditCards.title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            {t('creditCards.subtitle')}
          </p>
        </div>
        <Button onClick={() => {
          setEditingCard(null)
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 me-2" />
          {t('creditCards.addCard')}
        </Button>
      </div>

      {/* Summary Cards */}
      {creditCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('creditCards.totalPending')}
                </p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalPending, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('creditCards.activeCards')}
                </p>
                <p className="text-xl font-bold text-[rgb(var(--text-primary))]">
                  {creditCards.length}
                </p>
              </div>
            </div>
          </Card>

          {totalLimit > 0 && (
            <Card className="p-4 col-span-2 lg:col-span-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('creditCards.totalLimit')}
                  </p>
                  <p className="text-xl font-bold text-[rgb(var(--text-primary))]">
                    {formatCurrency(totalLimit, { locale: localeString, symbol: currencySymbol })}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Credit Cards List */}
      {creditCards.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<CreditCardIcon className="w-12 h-12" />}
            title={t('creditCards.emptyTitle')}
            description={t('creditCards.emptyDesc')}
          />
          <div className="text-center mt-4">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 me-2" />
              {t('creditCards.addFirstCard')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {creditCards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              currencySymbol={currencySymbol}
              localeString={localeString}
              onEdit={() => {
                setEditingCard(card)
                setIsModalOpen(true)
              }}
              onDelete={() => handleDelete(card.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <CreditCardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCard(null)
        }}
        editingCard={editingCard}
        accounts={accounts}
        onSuccess={() => {
          setIsModalOpen(false)
          setEditingCard(null)
          fetchData()
        }}
      />
    </div>
  )
}

// Card type names mapping
const CARD_TYPE_NAMES = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  isracard: 'Isracard',
  cal: 'Cal - כאל',
  max: 'Max - לאומי קארד',
  other: 'Other',
}

// Credit Card Item Component
function CreditCardItem({ card, currencySymbol, localeString, onEdit, onDelete }) {
  const { t } = useI18n()
  const [showMenu, setShowMenu] = useState(false)

  const limitUsedPercent = card.creditLimit
    ? Math.round((Number(card.pendingAmount) / Number(card.creditLimit)) * 100)
    : null

  const isNearLimit = limitUsedPercent !== null && limitUsedPercent >= 80

  // Get display name for card type
  const cardDisplayName = CARD_TYPE_NAMES[card.name] || card.name

  return (
    <Link href={`/credit-cards/${card.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer relative group">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${card.color}20` }}
            >
              <CreditCardIcon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                {cardDisplayName}
              </h3>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                •••• {card.lastFourDigits}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute end-0 top-full mt-1 z-20 w-36 bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] shadow-lg overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pending Amount */}
        <div className="mb-4">
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">
            {t('creditCards.pendingCharges')}
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(card.pendingAmount, { locale: localeString, symbol: currencySymbol })}
          </p>
        </div>

        {/* Limit Progress */}
        {card.creditLimit && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[rgb(var(--text-tertiary))]">
                {t('creditCards.creditLimit')}
              </span>
              <span className={cn(
                "font-medium",
                isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-[rgb(var(--text-secondary))]"
              )}>
                {limitUsedPercent}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  isNearLimit ? "bg-amber-500" : "bg-blue-500"
                )}
                style={{ width: `${Math.min(limitUsedPercent, 100)}%` }}
              />
            </div>
            {isNearLimit && (
              <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                <AlertTriangle className="w-3 h-3" />
                {t('creditCards.nearingLimit')}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))]">
            <Calendar className="w-4 h-4" />
            <span>
              {t('creditCards.billingIn', { days: card.daysUntilBilling })}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
        </div>
      </Card>
    </Link>
  )
}

// Credit Card Modal Component
function CreditCardModal({ isOpen, onClose, editingCard, accounts, onSuccess }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()

  const [formData, setFormData] = useState({
    name: '',
    lastFourDigits: '',
    billingDay: 10,
    linkedAccountId: '',
    creditLimit: '',
    color: '#3B82F6',
  })

  useEffect(() => {
    if (editingCard) {
      setFormData({
        name: editingCard.name,
        lastFourDigits: editingCard.lastFourDigits,
        billingDay: editingCard.billingDay,
        linkedAccountId: editingCard.linkedAccountId,
        creditLimit: editingCard.creditLimit || '',
        color: editingCard.color,
      })
    } else {
      setFormData({
        name: '',
        lastFourDigits: '',
        billingDay: 10,
        linkedAccountId: accounts[0]?.id || '',
        creditLimit: '',
        color: '#3B82F6',
      })
    }
  }, [editingCard, accounts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    showLoading()

    try {
      const url = editingCard 
        ? `/api/credit-cards/${editingCard.id}`
        : '/api/credit-cards'
      
      const response = await fetch(url, {
        method: editingCard ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          billingDay: parseInt(formData.billingDay),
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success(
        editingCard ? t('creditCards.updated') : t('creditCards.created')
      )
      onSuccess()
    } catch (error) {
      toast.error(
        editingCard ? t('creditCards.updateFailed') : t('creditCards.createFailed'),
        error.message
      )
    } finally {
      hideLoading()
    }
  }

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
  ]

  const cardTypes = [
    { id: 'visa', name: 'Visa', color: '#1A1F71' },
    { id: 'mastercard', name: 'Mastercard', color: '#EB001B' },
    { id: 'amex', name: 'American Express', color: '#006FCF' },
    { id: 'diners', name: 'Diners Club', color: '#0079BE' },
    { id: 'discover', name: 'Discover', color: '#FF6000' },
    { id: 'isracard', name: 'Isracard', color: '#00529B' },
    { id: 'cal', name: 'Cal - כאל', color: '#E31E24' },
    { id: 'max', name: 'Max - לאומי קארד', color: '#00A0DF' },
    { id: 'other', name: t('creditCards.cardTypes.other'), color: '#6B7280' },
  ]

  // Auto-set color when card type changes
  const handleCardTypeChange = (cardType) => {
    const selectedCard = cardTypes.find(c => c.id === cardType)
    setFormData({ 
      ...formData, 
      name: cardType,
      color: selectedCard?.color || '#3B82F6'
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCard ? t('creditCards.editCard') : t('creditCards.addCard')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('creditCards.cardType')}
          </label>
          <select
            value={formData.name}
            onChange={(e) => handleCardTypeChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
            required
          >
            <option value="">{t('creditCards.selectCardType')}</option>
            {cardTypes.map(card => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </div>

        <Input
          label={t('creditCards.lastFourDigits')}
          value={formData.lastFourDigits}
          onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          placeholder="1234"
          maxLength={4}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('creditCards.billingDay')}
            </label>
            <select
              value={formData.billingDay}
              onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              required
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('creditCards.linkedAccount')}
            </label>
            <select
              value={formData.linkedAccountId}
              onChange={(e) => setFormData({ ...formData, linkedAccountId: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              required
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={t('creditCards.creditLimit')}
          type="number"
          value={formData.creditLimit}
          onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
          placeholder={t('creditCards.creditLimitPlaceholder')}
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('creditCards.cardColor')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform",
                  formData.color === color && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1">
            {editingCard ? t('common.save') : t('creditCards.addCard')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
