'use client'

import { useState } from 'react'
import { KPICard, Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { RecurringIncomeModal } from '@/components/forms/RecurringIncomeModal'
import { ExpensesModal } from '@/components/ExpensesModal'
import { AccountModal } from '@/components/forms/AccountModal'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Receipt,
  Plus,
  Sparkles,
  PiggyBank,
  CreditCard,
  Banknote
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import Link from 'next/link'

export function DashboardClient({ 
  totalBalance, 
  totalIncome, 
  totalExpenses, 
  netCashFlow,
  accounts,
  recentTransactions,
  currentDate,
  recurringIncomeAmount = 0,
  recurringExpenseAmount = 0,
  actualIncome = 0,
  actualExpenses = 0,
  categories = [],
  monthlyExpenses = [],
  recurringExpenses = [],
  recurringExpenseDefinitions = []
}) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false)
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  const handleRecurringIncomeSuccess = () => {
    window.location.reload()
  }

  // Account icons based on type
  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank':
        return <Banknote className="w-5 h-5" />
      case 'credit':
        return <CreditCard className="w-5 h-5" />
      case 'cash':
        return <Wallet className="w-5 h-5" />
      default:
        return <PiggyBank className="w-5 h-5" />
    }
  }

  // Account colors based on type
  const getAccountStyle = (type) => {
    switch (type) {
      case 'bank':
        return {
          bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
          icon: 'text-blue-600 dark:text-blue-400'
        }
      case 'credit':
        return {
          bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40',
          icon: 'text-purple-600 dark:text-purple-400'
        }
      case 'cash':
        return {
          bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40',
          icon: 'text-emerald-600 dark:text-emerald-400'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/40 dark:to-gray-700/40',
          icon: 'text-gray-600 dark:text-gray-400'
        }
    }
  }
  
  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-8">
      {/* Page Header - Apple style with greeting */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {new Date(currentDate).toLocaleDateString(localeString, { 
                weekday: 'long',
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Premium KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Total Balance */}
        <KPICard
          title={t('dashboard.totalBalance')}
          value={formatCurrency(totalBalance, { locale: localeString, symbol: currencySymbol })}
          icon={<Wallet className="w-5 h-5" />}
          variant="balance"
        />
        
        {/* Income */}
        <KPICard
          title={t('dashboard.income')}
          value={formatCurrency(totalIncome, { locale: localeString, symbol: currencySymbol })}
          subtitle={
            recurringIncomeAmount > 0 && actualIncome < totalIncome
              ? `${formatCurrency(recurringIncomeAmount, { locale: localeString, symbol: currencySymbol })} ${t('dashboard.fromRecurring')}`
              : t('dashboard.thisMonth')
          }
          icon={<ArrowUpCircle className="w-5 h-5" />}
          variant="income"
          action={
            totalIncome === 0 ? (
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRecurringIncomeModalOpen(true)
                }}
                className="w-full"
              >
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('dashboard.addSalary')}
              </Button>
            ) : null
          }
        />
        
        {/* Expenses - Clickable */}
        <KPICard
          title={t('dashboard.expenses')}
          value={formatCurrency(totalExpenses, { locale: localeString, symbol: currencySymbol })}
          subtitle={
            recurringExpenseAmount > 0 && actualExpenses < totalExpenses
              ? `${formatCurrency(recurringExpenseAmount, { locale: localeString, symbol: currencySymbol })} ${t('dashboard.fromRecurring')}`
              : t('dashboard.thisMonth')
          }
          icon={<ArrowDownCircle className="w-5 h-5" />}
          variant="expense"
          onClick={() => setIsExpensesModalOpen(true)}
        />
        
        {/* Net Cash Flow */}
        <KPICard
          title={t('dashboard.net')}
          value={formatCurrency(netCashFlow, { locale: localeString, symbol: currencySymbol })}
          subtitle={t('dashboard.thisMonth')}
          icon={netCashFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          variant={netCashFlow >= 0 ? 'net' : 'netNegative'}
        />
      </div>

      {/* Accounts Section - Redesigned */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              {t('settings.accounts')}
            </h2>
            <Link
              href="/settings"
              className="text-sm font-medium text-light-accent dark:text-dark-accent hover:underline"
            >
              {t('common.manage')}
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const style = getAccountStyle(account.type)
              return (
                <div
                  key={account.id}
                  className="group relative overflow-hidden bg-light-elevated dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg}`}>
                        <span className={style.icon}>
                          {getAccountIcon(account.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                          {account.name}
                        </h3>
                        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary capitalize">
                          {t(`settings.${account.type}`)}
                        </p>
                      </div>
                    </div>
                    
                    <div dir="ltr" className={`text-2xl font-bold ${Number(account.balance) >= 0 ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(Number(account.balance), { locale: localeString, symbol: currencySymbol })}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Add Account Card */}
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="group relative overflow-hidden bg-light-surface dark:bg-dark-surface border-2 border-dashed border-light-border dark:border-dark-border rounded-2xl p-5 hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-elevated dark:hover:bg-dark-elevated transition-all duration-300 flex flex-col items-center justify-center min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-xl bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mb-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors">
                <Plus className="w-5 h-5 text-light-accent dark:text-dark-accent" />
              </div>
              <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
                {t('settings.addAccount')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Transactions - Redesigned */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            {t('dashboard.recentTransactions')}
          </h2>
          <Link
            href="/transactions"
            className="text-sm font-medium text-light-accent dark:text-dark-accent hover:underline"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>

        <Card className="overflow-hidden !p-0">
          {recentTransactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Receipt className="w-8 h-8" />}
                title={t('dashboard.noTransactions')}
                description={t('dashboard.startAdding')}
              />
            </div>
          ) : (
            <div className="divide-y divide-light-border/50 dark:divide-dark-border/50">
              {recentTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="group flex items-center gap-4 p-4 hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Transaction Type Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    transaction.type === 'income'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : transaction.type === 'transfer'
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-rose-100 dark:bg-rose-900/40'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : transaction.type === 'transfer' ? (
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  
                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                        {transaction.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      <span>
                        {new Date(transaction.date).toLocaleDateString(localeString, { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-light-text-tertiary/40 dark:bg-dark-text-tertiary/40" />
                      <span className="truncate">{transaction.account.name}</span>
                      {transaction.category && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-light-text-tertiary/40 dark:bg-dark-text-tertiary/40" />
                          <Badge variant="default" className="!py-0 !px-2 text-xs">
                            {transaction.category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div
                    dir="ltr"
                    className={`font-bold text-lg whitespace-nowrap ${
                      transaction.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : transaction.type === 'transfer'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                    {formatCurrency(Number(transaction.amount), { locale: localeString, symbol: currencySymbol })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Empty state for first-time users */}
      {accounts.length === 0 && (
        <Card className="relative overflow-hidden">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative z-10">
            <EmptyState
              icon={<Wallet className="w-8 h-8" />}
              title={t('dashboard.welcomeTitle')}
              description={t('dashboard.welcomeDescription')}
              action={() => window.location.href = '/settings'}
              actionLabel={t('dashboard.goToSettings')}
            />
          </div>
        </Card>
      )}

      {/* Recurring Income Modal */}
      <RecurringIncomeModal
        isOpen={isRecurringIncomeModalOpen}
        onClose={() => setIsRecurringIncomeModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={handleRecurringIncomeSuccess}
      />

      <ExpensesModal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        expenses={monthlyExpenses}
        recurringExpenses={recurringExpenses}
        recurringExpenseDefinitions={recurringExpenseDefinitions}
        accounts={accounts}
        categories={categories}
        onExpenseUpdated={() => window.location.reload()}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
