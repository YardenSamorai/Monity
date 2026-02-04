'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagSelector } from '@/components/tags/TagSelector'
import { CategorySuggestions } from '@/components/ai/CategorySuggestions'
import { TransactionTemplates } from '@/components/templates/TransactionTemplates'
import { ReceiptScanner } from '@/components/receipt/ReceiptScanner'
import { Camera } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'
import { Building2, Banknote, CreditCard } from 'lucide-react'

// Cache household data at module level to avoid refetching
let cachedHousehold = null
let householdFetched = false

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

export function TransactionModal({ isOpen, onClose, accounts, categories, onSuccess, editingTransaction = null, household: propHousehold = null }) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [creditCards, setCreditCards] = useState([])
  const isEditing = !!editingTransaction
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    paymentMethod: 'account', // 'account', 'cash', 'creditCard'
    accountId: accounts[0]?.id || '',
    creditCardId: '',
    categoryId: '',
    date: new Date().toISOString().slice(0, 16),
    notes: '',
    isShared: false,
  })
  const [transactionTags, setTransactionTags] = useState([])
  const [household, setHousehold] = useState(propHousehold || cachedHousehold)
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false)

  // Handle receipt scan data
  const handleReceiptExtracted = (data) => {
    setFormData(prev => ({
      ...prev,
      amount: data.amount || prev.amount,
      description: data.description || prev.description,
      date: data.date ? `${data.date}T12:00` : prev.date,
    }))
  }

  // Fetch credit cards
  useEffect(() => {
    fetch('/api/credit-cards')
      .then(res => res.json())
      .then(data => {
        const cards = data.creditCards || []
        setCreditCards(cards)
        if (cards.length > 0 && !formData.creditCardId) {
          setFormData(prev => ({ ...prev, creditCardId: cards[0].id }))
        }
      })
      .catch(() => {})
  }, [])

  // Load household once (use cache after first fetch)
  useEffect(() => {
    // If already have household from prop or cache, skip fetch
    if (propHousehold) {
      setHousehold(propHousehold)
      cachedHousehold = propHousehold
      householdFetched = true
      return
    }
    
    if (cachedHousehold) {
      setHousehold(cachedHousehold)
      return
    }
    
    // Only fetch if we haven't fetched before
    if (!householdFetched) {
      householdFetched = true
      fetch('/api/households')
        .then(res => res.json())
        .then(data => {
          if (data.household) {
            cachedHousehold = data.household
            setHousehold(data.household)
          }
        })
        .catch(() => {})
    }
  }, [propHousehold])

  // Load editing transaction data when modal opens
  useEffect(() => {
    if (isOpen && editingTransaction) {
      const date = new Date(editingTransaction.date)
      setFormData({
        type: editingTransaction.type,
        amount: String(editingTransaction.amount),
        description: editingTransaction.description,
        paymentMethod: 'account', // When editing, assume it's account (credit card transactions are edited separately)
        accountId: editingTransaction.accountId,
        creditCardId: creditCards[0]?.id || '',
        categoryId: editingTransaction.categoryId || '',
        date: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        notes: editingTransaction.notes || '',
        isShared: editingTransaction.isShared || false,
      })
      // Load tags for editing transaction
      if (editingTransaction.tags) {
        setTransactionTags(editingTransaction.tags)
      } else {
        setTransactionTags([])
      }
    } else if (isOpen && !editingTransaction) {
      // Reset form for new transaction
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        paymentMethod: 'account',
        accountId: accounts[0]?.id || '',
        creditCardId: creditCards[0]?.id || '',
        categoryId: '',
        date: new Date().toISOString().slice(0, 16),
        notes: '',
        isShared: false,
      })
      setTransactionTags([])
    }
  }, [isOpen, editingTransaction, accounts, creditCards])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Credit card transaction
      if (formData.paymentMethod === 'creditCard' && formData.creditCardId) {
        const response = await fetch(`/api/credit-cards/${formData.creditCardId}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(formData.amount),
            description: formData.description,
            categoryId: formData.categoryId || null,
            date: new Date(formData.date).toISOString(),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create credit card transaction')
        }

        toast.success(t('transactions.created'), t('creditCards.transactionAdded'))
      } else {
        // Regular bank/cash transaction
        const url = isEditing 
          ? `/api/transactions/${editingTransaction.id}`
          : '/api/transactions'
        
        const method = isEditing ? 'PATCH' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            amount: parseFloat(formData.amount),
            description: formData.description,
            accountId: formData.accountId,
            categoryId: formData.categoryId || null,
            notes: formData.notes || null,
            date: new Date(formData.date).toISOString(),
            isShared: formData.isShared && household ? true : false,
            householdId: formData.isShared && household ? household.id : null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || (isEditing ? 'Failed to update transaction' : 'Failed to create transaction'))
        }

        if (isEditing) {
          toast.success(t('transactions.updated'), t('transactions.updatedSuccess'))
        } else {
          toast.success(t('transactions.created'), t('transactions.createdSuccess'))
        }
      }
      
      onSuccess?.()
      onClose()
      
      // Reset form
      if (!isEditing) {
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          paymentMethod: 'account',
          accountId: accounts[0]?.id || '',
          creditCardId: creditCards[0]?.id || '',
          categoryId: '',
          date: new Date().toISOString().slice(0, 16),
          notes: '',
          isShared: false,
        })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} transaction:`, error)
      toast.error(
        isEditing ? t('transactions.updateFailed') : t('transactions.createFailed'), 
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(
    cat => cat.type === formData.type || cat.type === 'both'
  )

  // Payment method options
  const paymentMethods = [
    { id: 'account', icon: Building2, label: t('transactions.paymentMethods.account') },
    { id: 'cash', icon: Banknote, label: t('transactions.paymentMethods.cash') },
    { id: 'creditCard', icon: CreditCard, label: t('transactions.paymentMethods.creditCard') },
  ]

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      type: template.type || 'expense',
      amount: template.amount ? String(template.amount) : '',
      description: template.description || '',
      categoryId: template.categoryId || '',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('transactions.editTransaction') : t('transactions.addTransaction')} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {/* Quick Templates and Scan Receipt - only show when not editing */}
          {!isEditing && (
            <div className="flex items-center justify-between gap-3">
              <TransactionTemplates
                onSelect={handleTemplateSelect}
                currentFormData={formData}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setIsReceiptScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--accent))]/10 hover:text-[rgb(var(--accent))] transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {t('receipt.scanReceipt')}
              </button>
            </div>
          )}

          {/* Type and Amount - side by side on mobile */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('transactions.type')}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
              required
            >
              <option value="expense">{t('transactions.expense')}</option>
              <option value="income">{t('transactions.income')}</option>
            </Select>

            <Input
              label={t('transactions.amount')}
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <Input
            label={t('transactions.description')}
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('transactions.descriptionPlaceholder')}
            required
          />

          {/* Payment Method Selector - only show for expenses and not editing */}
          {formData.type === 'expense' && !isEditing && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                {t('transactions.paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(method => {
                  const Icon = method.icon
                  const isSelected = formData.paymentMethod === method.id
                  const isDisabled = method.id === 'creditCard' && creditCards.length === 0
                  
                  return (
                    <button
                      key={method.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                        isSelected
                          ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5"
                          : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5",
                        isSelected ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text-tertiary))]"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text-secondary))]"
                      )}>
                        {method.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {creditCards.length === 0 && (
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1.5">
                  {t('transactions.noCreditCards')}
                </p>
              )}
            </div>
          )}

          {/* Account/Credit Card and Category - side by side on mobile */}
          <div className="grid grid-cols-2 gap-3">
            {/* Show Account dropdown for account/cash, or Credit Card dropdown for creditCard */}
            {formData.paymentMethod === 'creditCard' && formData.type === 'expense' && !isEditing ? (
              <Select
                label={t('creditCards.selectCard')}
                value={formData.creditCardId}
                onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
                required
              >
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {CARD_TYPE_NAMES[card.name] || card.name} •••• {card.lastFourDigits}
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                label={t('transactions.account')}
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            )}

            {/* Smart Category Suggestions */}
            <div className="col-span-2">
              <CategorySuggestions
                description={formData.description}
                amount={formData.amount}
                type={formData.type}
                selectedCategoryId={formData.categoryId}
                onSelect={(categoryId) => setFormData({ ...formData, categoryId })}
              />
            </div>

            <Select
              label={t('transactions.category')}
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">{t('transactions.uncategorized')}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label={t('transactions.date')}
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label={t('transactions.notes')}
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('transactions.notesPlaceholder')}
          />

          {/* Shared toggle - only show if user has household and not credit card */}
          {household && formData.paymentMethod !== 'creditCard' && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[rgb(var(--bg-tertiary))]">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
                  {t('transactions.shared')}
                </label>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.isShared}
                onClick={() => setFormData({ ...formData, isShared: !formData.isShared })}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 flex-shrink-0',
                  formData.isShared
                    ? 'bg-[rgb(var(--accent))]'
                    : 'bg-[rgb(var(--text-tertiary))]/30'
                )}
                dir="ltr"
              >
                <span
                  className={cn(
                    'absolute h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200',
                    formData.isShared ? 'left-6' : 'left-1'
                  )}
                />
              </button>
            </div>
          )}

          {/* Tags - only show when editing */}
          {isEditing && editingTransaction && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                {t('tags.tags')}
              </label>
              <TagSelector
                transactionId={editingTransaction.id}
                selectedTags={transactionTags}
                onTagsChange={setTransactionTags}
              />
            </div>
          )}
        </div>

        {/* Sticky buttons at bottom */}
        <div className="flex gap-3 pt-3 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]">
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
            {loading ? t('common.loading') : (isEditing ? t('transactions.updateTransaction') : t('transactions.addTransaction'))}
          </Button>
        </div>
      </form>

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        onExtracted={handleReceiptExtracted}
      />
    </Modal>
  )
}
