'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccountModal } from '@/components/forms/AccountModal'
import { CategoryModal } from '@/components/forms/CategoryModal'
import { RecurringIncomeModal } from '@/components/forms/RecurringIncomeModal'
import { RecurringTransactionModal } from '@/components/forms/RecurringTransactionModal'
import { DeleteRecurringIncomeDialog } from '@/components/forms/DeleteRecurringIncomeDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { formatCurrency } from '@/lib/utils'
import { Wallet, Tag, Key, Repeat, ArrowDownCircle, ArrowUpCircle, Globe, Settings as SettingsIcon, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { translations } from '@/lib/translations'

export function SettingsClient({ initialAccounts, initialCategories, initialTokens, initialRecurringIncomes, initialRecurringTransactions }) {
  const { toast } = useToast()
  const { t, currencySymbol, localeString, locale } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [accounts, setAccounts] = useState(initialAccounts)
  const [categories, setCategories] = useState(initialCategories)
  const [apiTokens, setApiTokens] = useState(initialTokens)
  const [recurringIncomes, setRecurringIncomes] = useState(initialRecurringIncomes)
  const [recurringTransactions, setRecurringTransactions] = useState(initialRecurringTransactions || [])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false)
  const [isRecurringTransactionModalOpen, setIsRecurringTransactionModalOpen] = useState(false)
  const [editingRecurringIncome, setEditingRecurringIncome] = useState(null)
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState(null)
  const [recurringTransactionType, setRecurringTransactionType] = useState('expense')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recurringIncomeToDelete, setRecurringIncomeToDelete] = useState(null)
  const [recurringTransactionToDelete, setRecurringTransactionToDelete] = useState(null)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [recalculatingBalances, setRecalculatingBalances] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountToDelete, setAccountToDelete] = useState(null)
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false)

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['general', 'accounts', 'recurring', 'api'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    router.push(`/settings?tab=${tabId}`, { scroll: false })
  }

  const handleAccountSuccess = async () => {
    const response = await fetch('/api/accounts')
    const data = await response.json()
    setAccounts(data.accounts)
  }

  const handleCategorySuccess = async () => {
    const response = await fetch('/api/categories')
    const data = await response.json()
    setCategories(data.categories)
  }

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category)
    setIsDeleteCategoryDialogOpen(true)
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Category is in use') {
          toast.error(t('settings.categoryInUse'), t('settings.categoryInUseDesc'))
        } else if (data.error === 'Cannot delete default categories') {
          toast.error(t('settings.cannotDeleteDefault'))
        } else {
          toast.error(t('settings.deleteFailed'), data.error || data.message)
        }
        setIsDeleteCategoryDialogOpen(false)
        setCategoryToDelete(null)
        return
      }

      toast.success(t('settings.categoryDeleted'))
      setCategories(prevCategories => 
        prevCategories.filter(cat => cat.id !== categoryToDelete.id)
      )
      setCategoryToDelete(null)
      setIsDeleteCategoryDialogOpen(false)
      await handleCategorySuccess()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(t('settings.deleteFailed'), error.message)
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleDeleteAccount = (account) => {
    setAccountToDelete(account)
    setIsDeleteAccountDialogOpen(true)
  }

  const handleDeleteAccountConfirm = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/accounts/${accountToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Account is in use') {
          toast.error(t('settings.accountInUse'), t('settings.accountInUseDesc'))
        } else {
          toast.error(t('settings.deleteFailed'), data.error || data.message)
        }
        return
      }

      toast.success(t('settings.accountDeleted'))
      await handleAccountSuccess()
      setAccountToDelete(null)
    } catch (error) {
      toast.error(t('settings.deleteFailed'), error.message)
    } finally {
      setIsDeleteAccountDialogOpen(false)
    }
  }

  const handleRecurringIncomeSuccess = async () => {
    const response = await fetch('/api/recurring-income')
    const data = await response.json()
    setRecurringIncomes(data.recurringIncomes)
  }

  const handleRecurringTransactionSuccess = async () => {
    const response = await fetch('/api/recurring-transactions')
    const data = await response.json()
    setRecurringTransactions(data.recurringTransactions)
  }

  const handleEditRecurringTransaction = (transaction) => {
    setEditingRecurringTransaction(transaction)
    setIsRecurringTransactionModalOpen(true)
  }

  const handleDeleteRecurringTransaction = (transaction) => {
    setRecurringTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteRecurringTransactionOnly = async () => {
    if (!recurringTransactionToDelete) return

    try {
      const response = await fetch(`/api/recurring-transactions/${recurringTransactionToDelete.id}?deleteTransactions=false`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete recurring transaction')

      toast.success(t('settings.recurringTransactionDeleted'))
      await handleRecurringTransactionSuccess()
    } catch (error) {
      toast.error(t('settings.deleteFailed'), error.message)
    } finally {
      setRecurringTransactionToDelete(null)
    }
  }

  const handleDeleteRecurringTransactionWithTransactions = async () => {
    if (!recurringTransactionToDelete) return

    try {
      const response = await fetch(`/api/recurring-transactions/${recurringTransactionToDelete.id}?deleteTransactions=true`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete recurring transaction')

      const data = await response.json()
      toast.success(
        t('settings.recurringTransactionDeletedCompletely'),
        t('settings.deletedTransactionsCount', { count: data.deletedTransactions || 0 })
      )
      await handleRecurringTransactionSuccess()
    } catch (error) {
      toast.error(t('settings.deleteFailed'), error.message)
    } finally {
      setRecurringTransactionToDelete(null)
    }
  }

  const handleRecalculateBalances = async () => {
    if (!confirm(t('settings.recalculateBalancesConfirm'))) {
      return
    }

    setRecalculatingBalances(true)
    try {
      const response = await fetch('/api/accounts/recalculate-balances', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to recalculate balances')
      }

      const data = await response.json()
      toast.success(
        t('settings.balancesRecalculated'),
        t('settings.balancesRecalculatedDesc', { 
          accountsCount: data.results?.length || 0 
        })
      )
      window.location.reload()
    } catch (error) {
      console.error('Error recalculating balances:', error)
      toast.error(t('settings.recalculateFailed'), error.message)
    } finally {
      setRecalculatingBalances(false)
    }
  }

  const handleToggleRecurringTransaction = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/recurring-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to toggle recurring transaction')

      toast.success(
        !currentStatus ? t('settings.recurringTransactionActivated') : t('settings.recurringTransactionPaused'),
        !currentStatus ? t('settings.recurringIncomeActivatedDesc') : t('settings.recurringIncomePausedDesc')
      )

      await handleRecurringTransactionSuccess()
    } catch (error) {
      toast.error(t('settings.updateFailed'), error.message)
    }
  }

  const handleToggleRecurringIncome = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/recurring-income/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to toggle recurring income')

      toast.success(
        !currentStatus ? 'Recurring income activated' : 'Recurring income paused',
        !currentStatus ? 'Transactions will be created automatically' : 'No more automatic transactions'
      )

      await handleRecurringIncomeSuccess()
    } catch (error) {
      toast.error('Failed to update', error.message)
    }
  }

  const handleDeleteRecurringIncome = (income) => {
    setRecurringIncomeToDelete(income)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteOnly = async () => {
    if (!recurringIncomeToDelete) return

    try {
      const response = await fetch(`/api/recurring-income/${recurringIncomeToDelete.id}?deleteTransactions=false`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete recurring income')

      toast.success(t('settings.recurringIncomeDeleted'))
      await handleRecurringIncomeSuccess()
    } catch (error) {
      toast.error(t('settings.deleteFailed'), error.message)
    } finally {
      setRecurringIncomeToDelete(null)
    }
  }

  const handleDeleteWithTransactions = async () => {
    if (!recurringIncomeToDelete) return

    try {
      const response = await fetch(`/api/recurring-income/${recurringIncomeToDelete.id}?deleteTransactions=true`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete recurring income')

      const data = await response.json()
      toast.success(
        t('settings.recurringIncomeDeletedCompletely'),
        t('settings.deletedTransactionsCount', { count: data.deletedTransactions || 0 })
      )
      await handleRecurringIncomeSuccess()
    } catch (error) {
      toast.error(t('settings.deleteFailed'), error.message)
    } finally {
      setRecurringIncomeToDelete(null)
    }
  }

  const handleGenerateToken = async () => {
    setGeneratingToken(true)
    try {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'iPhone Shortcut' }),
      })

      if (!response.ok) throw new Error('Failed to generate token')

      const data = await response.json()
      await navigator.clipboard.writeText(data.token.token)
      toast.success('Token generated', 'Token copied to clipboard. Save it securely!')
      
      const tokensResponse = await fetch('/api/api-tokens')
      const tokensData = await tokensResponse.json()
      setApiTokens(tokensData.tokens)
    } catch (error) {
      toast.error('Failed to generate token', error.message)
    } finally {
      setGeneratingToken(false)
    }
  }

  const tabs = [
    {
      id: 'general',
      label: t('settings.tabs.general'),
      icon: <SettingsIcon className="w-4 h-4" />,
    },
    {
      id: 'accounts',
      label: t('settings.tabs.accounts'),
      icon: <Wallet className="w-4 h-4" />,
      badge: (accounts.length + categories.length) > 0 
        ? (accounts.length + categories.length) 
        : undefined,
    },
    {
      id: 'recurring',
      label: t('settings.tabs.recurring'),
      icon: <Repeat className="w-4 h-4" />,
      badge: (recurringIncomes.length + recurringTransactions.length) > 0 
        ? (recurringIncomes.length + recurringTransactions.length) 
        : undefined,
    },
    {
      id: 'api',
      label: t('settings.tabs.api'),
      icon: <Key className="w-4 h-4" />,
      badge: apiTokens.length > 0 ? apiTokens.length : undefined,
    },
  ]

  return (
    <>
      {/* Header - Mobile Optimized */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 lg:mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          {t('settings.subtitle')}
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* General Tab */}
      <TabPanel active={activeTab === 'general'} id="general">
        <div className="space-y-4 lg:space-y-6">
          {/* Language Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex items-start gap-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-light-accent dark:text-dark-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-0.5">
                  {t('settings.language')}
                </h2>
                <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                  {t('settings.languageDescription')}
                </p>
              </div>
            </div>
            <LanguageSelector />
          </Card>

          {/* Theme Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex items-start gap-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-light-accent dark:text-dark-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-0.5">
                  {t('settings.theme')}
                </h2>
                <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                  {t('settings.themeDescription')}
                </p>
              </div>
            </div>
            <ThemeToggle showLabel />
          </Card>
        </div>
      </TabPanel>

      {/* Accounts & Categories Tab */}
      <TabPanel active={activeTab === 'accounts'} id="accounts">
        <div className="space-y-4 lg:space-y-6">
          {/* Accounts Section */}
          <Card className="p-4 lg:p-6">
            {/* Header - Stacked on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-light-accent dark:text-dark-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {t('settings.accounts')}
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('settings.accountsDescription')}
                  </p>
                </div>
              </div>
              {/* Buttons - Full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleRecalculateBalances}
                  disabled={recalculatingBalances}
                  className="w-full sm:w-auto text-xs lg:text-sm"
                >
                  {recalculatingBalances ? t('common.loading') : t('settings.recalculateBalances')}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setEditingAccount(null)
                    setIsAccountModalOpen(true)
                  }}
                  className="w-full sm:w-auto"
                >
                  {t('settings.addAccount')}
                </Button>
              </div>
            </div>
            
            {accounts.length === 0 ? (
              <EmptyState
                icon={<Wallet className="w-8 h-8" />}
                title={t('settings.noAccounts')}
                description={t('settings.createFirstAccount')}
                action={() => setIsAccountModalOpen(true)}
                actionLabel={t('settings.addAccount')}
              />
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-light-border-light dark:border-dark-border-light rounded-xl hover:border-light-border dark:hover:border-dark-border transition-colors"
                  >
                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                          {account.name}
                        </span>
                        <Badge variant={account.isActive ? 'success' : 'default'} className="text-xs">
                          {account.isActive ? t('settings.active') : t('settings.inactive')}
                        </Badge>
                      </div>
                      <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary capitalize">
                        {t(`settings.${account.type}`)} • {account.currency}
                      </div>
                    </div>
                    
                    {/* Balance & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="font-semibold text-light-text-primary dark:text-dark-text-primary" dir="ltr">
                        {formatCurrency(Number(account.balance), { locale: localeString, symbol: account.currency === 'ILS' ? '₪' : '$' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingAccount(account)
                            setIsAccountModalOpen(true)
                          }}
                          aria-label={t('common.edit')}
                          className="p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAccount(account)}
                          aria-label={t('common.delete')}
                          className="p-2 text-light-danger dark:text-dark-danger hover:text-light-danger dark:hover:text-dark-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Categories Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-success-light dark:bg-dark-success-light flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-light-success dark:text-dark-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {t('settings.categories')}
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('settings.categoriesDescription')}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingCategory(null)
                  setIsCategoryModalOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                {t('settings.addCategory')}
              </Button>
            </div>

            {/* Info message */}
            <div className="mb-4 p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border-light dark:border-dark-border-light">
              <p className="text-xs lg:text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('settings.categoriesInfo')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                let categoryName = category.name
                if (category.isDefault) {
                  const categoryTranslations = translations[locale]?.settings?.categoryNames
                  if (categoryTranslations && categoryTranslations[category.name]) {
                    categoryName = categoryTranslations[category.name]
                  }
                }

                return (
                  <div
                    key={category.id}
                    className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ color: category.color }}
                    >
                      {categoryName}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 rounded-full opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: category.color }} />
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* Recurring Tab */}
      <TabPanel active={activeTab === 'recurring'} id="recurring">
        <div className="space-y-4 lg:space-y-6">
          {/* Recurring Income Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-success-light dark:bg-dark-success-light flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-5 h-5 text-light-success dark:text-dark-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {t('settings.recurringIncome')}
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('settings.recurringIncomeDescription')}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="success"
                onClick={() => {
                  setEditingRecurringIncome(null)
                  setIsRecurringIncomeModalOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                {t('settings.addRecurringIncome')}
              </Button>
            </div>
            
            {recurringIncomes.length === 0 ? (
              <EmptyState
                icon={<Repeat className="w-8 h-8" />}
                title={t('settings.noRecurringIncome')}
                description={t('settings.setUpRecurringIncome')}
                action={() => setIsRecurringIncomeModalOpen(true)}
                actionLabel={t('settings.addRecurringIncome')}
              />
            ) : (
              <div className="space-y-3">
                {recurringIncomes.map((income) => (
                  <div
                    key={income.id}
                    className="p-3 border border-light-border-light dark:border-dark-border-light rounded-xl"
                  >
                    {/* Info Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                            {income.description}
                          </span>
                          <Badge variant={income.isActive ? 'success' : 'default'} className="text-xs">
                            {income.isActive ? t('settings.active') : t('settings.paused')}
                          </Badge>
                        </div>
                        <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                          <span dir="ltr" className="inline-block">
                            {formatCurrency(Number(income.amount), { locale: localeString, symbol: currencySymbol })}
                          </span>
                          {' • '}{t('settings.dayOfMonthOption', { day: income.dayOfMonth })}
                        </div>
                        {(income.lastRunDate || income.nextRunDate) && (
                          <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                            {income.nextRunDate && `${t('settings.next')}: ${new Date(income.nextRunDate).toLocaleDateString(localeString)}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-light-border-light dark:border-dark-border-light">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRecurringIncome(income)
                          setIsRecurringIncomeModalOpen(true)
                        }}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleRecurringIncome(income.id, income.isActive)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        {income.isActive ? t('settings.pause') : t('settings.activate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRecurringIncome(income)}
                        className="flex-1 sm:flex-none text-xs text-light-danger dark:text-dark-danger"
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recurring Expenses Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-5 h-5 text-light-accent dark:text-dark-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {t('settings.recurringExpenses')}
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('settings.recurringExpensesDescription')}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => {
                  setRecurringTransactionType('expense')
                  setEditingRecurringTransaction(null)
                  setIsRecurringTransactionModalOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                {t('settings.addRecurringExpense')}
              </Button>
            </div>
            
            {recurringTransactions.filter(t => t.type === 'expense').length === 0 ? (
              <EmptyState
                icon={<Repeat className="w-8 h-8" />}
                title={t('settings.noRecurringExpenses')}
                description={t('settings.createFirstRecurringExpense')}
                action={() => {
                  setRecurringTransactionType('expense')
                  setIsRecurringTransactionModalOpen(true)
                }}
                actionLabel={t('settings.addRecurringExpense')}
                actionVariant="destructive"
              />
            ) : (
              <div className="space-y-3">
                {recurringTransactions.filter(t => t.type === 'expense').map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 border border-light-border-light dark:border-dark-border-light rounded-xl"
                  >
                    {/* Info Row */}
                    <div className="flex items-start gap-2 mb-2">
                      <ArrowDownCircle className="w-4 h-4 text-light-danger dark:text-dark-danger flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                            {transaction.description}
                          </span>
                          {!transaction.isActive && (
                            <Badge variant="default" className="text-xs">
                              {t('settings.paused')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                          <span dir="ltr" className="inline-block">
                            {formatCurrency(Number(transaction.amount), { locale: localeString, symbol: currencySymbol })}
                          </span>
                          {' • '}{t('settings.dayOfMonthOption', { day: transaction.dayOfMonth })}
                          {' • '}{transaction.account.name}
                        </div>
                        {(transaction.category || transaction.endDate) && (
                          <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                            {transaction.category && transaction.category.name}
                            {transaction.category && transaction.endDate && ' • '}
                            {transaction.endDate && `${t('settings.endsOn')} ${new Date(transaction.endDate).toLocaleDateString(localeString)}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-light-border-light dark:border-dark-border-light">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditRecurringTransaction(transaction)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleRecurringTransaction(transaction.id, transaction.isActive)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        {transaction.isActive ? t('settings.pause') : t('settings.activate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRecurringTransaction(transaction)}
                        className="flex-1 sm:flex-none text-xs text-light-danger dark:text-dark-danger"
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TabPanel>

      {/* API & Integration Tab */}
      <TabPanel active={activeTab === 'api'} id="api">
        <div className="space-y-4 lg:space-y-6">
          <Card className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-warning-light dark:bg-dark-warning-light flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-light-warning dark:text-dark-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {t('settings.apiTokens')}
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {t('settings.apiTokensDescription')}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleGenerateToken} 
                disabled={generatingToken}
                className="w-full sm:w-auto"
              >
                {generatingToken ? t('common.loading') : t('settings.generateToken')}
              </Button>
            </div>
            
            {apiTokens.length === 0 ? (
              <EmptyState
                icon={<Key className="w-8 h-8" />}
                title={t('settings.noTokens')}
                description={t('settings.createToken')}
                action={handleGenerateToken}
                actionLabel={t('settings.generateToken')}
              />
            ) : (
              <div className="space-y-3">
                {apiTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border border-light-border-light dark:border-dark-border-light rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                          {token.name}
                        </span>
                        <Badge variant={token.isActive ? 'success' : 'default'} className="text-xs">
                          {token.isActive ? t('settings.active') : t('settings.paused')}
                        </Badge>
                      </div>
                      <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary font-mono mt-1">
                        {token.token.substring(0, 16)}...
                      </div>
                      <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                        {new Date(token.createdAt).toLocaleDateString(localeString)}
                        {token.lastUsedAt && ` • ${t('settings.lastUsed')} ${new Date(token.lastUsedAt).toLocaleDateString(localeString)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TabPanel>

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false)
          setEditingAccount(null)
        }}
        onSuccess={handleAccountSuccess}
        editingAccount={editingAccount}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setEditingCategory(null)
        }}
        onSuccess={handleCategorySuccess}
        editingCategory={editingCategory}
      />

      <RecurringIncomeModal
        isOpen={isRecurringIncomeModalOpen}
        onClose={() => {
          setIsRecurringIncomeModalOpen(false)
          setEditingRecurringIncome(null)
        }}
        accounts={accounts}
        categories={categories}
        editingIncome={editingRecurringIncome}
        onSuccess={handleRecurringIncomeSuccess}
      />

      <RecurringTransactionModal
        isOpen={isRecurringTransactionModalOpen}
        onClose={() => {
          setIsRecurringTransactionModalOpen(false)
          setEditingRecurringTransaction(null)
        }}
        accounts={accounts}
        categories={categories}
        onSuccess={handleRecurringTransactionSuccess}
        editingTransaction={editingRecurringTransaction}
        defaultType={recurringTransactionType}
      />

      <DeleteRecurringIncomeDialog
        isOpen={isDeleteDialogOpen && recurringIncomeToDelete}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setRecurringIncomeToDelete(null)
        }}
        onDelete={handleDeleteOnly}
        onDeleteWithTransactions={handleDeleteWithTransactions}
        recurringIncomeDescription={recurringIncomeToDelete?.description || ''}
      />

      {recurringTransactionToDelete && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen && !!recurringTransactionToDelete}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setRecurringTransactionToDelete(null)
          }}
          title={t('settings.deleteRecurringTransaction')}
          message={t('settings.deleteRecurringTransactionMessage', { description: recurringTransactionToDelete.description })}
          confirmLabel={t('settings.deleteRecurringTransactionWithTransactions')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleDeleteRecurringTransactionWithTransactions}
          variant="danger"
          secondaryAction={{
            label: t('settings.deleteRecurringTransactionOnly'),
            description: t('settings.deleteOption2Desc'),
            onClick: handleDeleteRecurringTransactionOnly,
          }}
        />
      )}

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={isDeleteCategoryDialogOpen}
        onClose={() => {
          setIsDeleteCategoryDialogOpen(false)
          setCategoryToDelete(null)
        }}
        title={t('settings.deleteCategory')}
        message={t('settings.deleteCategoryMessage', { name: categoryToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteCategoryConfirm}
        variant="danger"
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAccountDialogOpen}
        onClose={() => {
          setIsDeleteAccountDialogOpen(false)
          setAccountToDelete(null)
        }}
        title={t('settings.deleteAccount')}
        message={t('settings.deleteAccountMessage', { name: accountToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteAccountConfirm}
        variant="danger"
      />
    </>
  )
}
