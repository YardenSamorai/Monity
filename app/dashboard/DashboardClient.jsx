'use client'

import { useState } from 'react'
import { RecurringIncomeModal } from '@/components/forms/RecurringIncomeModal'
import { ExpensesModal } from '@/components/ExpensesModal'
import { AccountModal } from '@/components/forms/AccountModal'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Plus,
  Building2,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  PieChart,
  AlertTriangle,
  BarChart3,
  Zap,
  ArrowRight,
  Target
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
  recurringExpenseDefinitions = [],
  // Insights data
  lastMonthExpenses = 0,
  topCategories = [],
  budgetAlerts = [],
  biggestExpense = null,
  // Goals
  goals = [],
}) {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false)
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  const getAccountIcon = (type) => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'bank': return <Building2 className={iconClass} />
      case 'credit': return <CreditCard className={iconClass} />
      case 'cash': return <Banknote className={iconClass} />
      default: return <Wallet className={iconClass} />
    }
  }

  const isNewUser = accounts.length === 0 && recentTransactions.length === 0
  const hasNoTransactions = recentTransactions.length === 0

  // Calculate month comparison
  const monthDifference = lastMonthExpenses > 0 
    ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0
  const isSpendingMore = monthDifference > 0
  const hasLastMonthData = lastMonthExpenses > 0
  
  // Check if we have any insights to show
  const hasInsights = topCategories.length > 0 || hasLastMonthData || budgetAlerts.length > 0 || biggestExpense

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] w-full">
      <div className="w-full px-4 py-4 lg:px-6 lg:py-6">
        
        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          
          {/* ============================================
              SUMMARY SECTION - Full width on mobile, 8 cols on desktop
              ============================================ */}
          <section className="col-span-12 lg:col-span-8 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
            {/* Balance - Main Focus */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <PieChart className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                  {t('dashboard.totalBalance')}
                </p>
              </div>
              <p 
                className={cn(
                  "text-4xl lg:text-5xl font-bold tracking-tight tabular-nums leading-none",
                  totalBalance >= 0 ? "text-[rgb(var(--text-primary))]" : "text-negative"
                )}
                dir="ltr"
              >
                {formatCurrency(totalBalance, { locale: localeString, symbol: currencySymbol })}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
                {new Date(currentDate).toLocaleDateString(localeString, { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-[rgb(var(--border-secondary))] border-t border-[rgb(var(--border-secondary))] bg-[rgb(var(--bg-primary))]">
              {/* Income */}
              <div className="px-3 py-3 text-center lg:text-start lg:px-5">
                <div className="flex items-center justify-center lg:justify-start gap-1 mb-0.5">
                  <ArrowUpRight className="w-3 h-3 text-positive" />
                  <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                    {t('dashboard.income')}
                  </span>
                </div>
                <p className="text-sm lg:text-lg font-semibold text-positive tabular-nums" dir="ltr">
                  {formatCurrency(totalIncome, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>

              {/* Expenses */}
              <button 
                onClick={() => setIsExpensesModalOpen(true)}
                className="px-3 py-3 text-center lg:text-start lg:px-5 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
              >
                <div className="flex items-center justify-center lg:justify-start gap-1 mb-0.5">
                  <ArrowDownRight className="w-3 h-3 text-negative" />
                  <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                    {t('dashboard.expenses')}
                  </span>
                </div>
                <p className="text-sm lg:text-lg font-semibold text-negative tabular-nums" dir="ltr">
                  {formatCurrency(totalExpenses, { locale: localeString, symbol: currencySymbol })}
                </p>
              </button>

              {/* Net */}
              <div className="px-3 py-3 text-center lg:text-start lg:px-5">
                <div className="flex items-center justify-center lg:justify-start gap-1 mb-0.5">
                  {netCashFlow >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-positive" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-negative" />
                  )}
                  <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase">
                    {t('dashboard.net')}
                  </span>
                </div>
                <p 
                  className={cn(
                    "text-sm lg:text-lg font-semibold tabular-nums",
                    netCashFlow >= 0 ? "text-positive" : "text-negative"
                  )}
                  dir="ltr"
                >
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
            </div>
          </section>

          {/* ============================================
              ACCOUNTS SECTION - Full width on mobile, 4 cols on desktop
              ============================================ */}
          <section className="col-span-12 lg:col-span-4 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {t('settings.accounts')}
                </h2>
              </div>
              <Link 
                href="/settings?tab=accounts" 
                className="text-xs text-[rgb(var(--accent))] hover:underline"
              >
                {t('common.manage')}
              </Link>
            </div>
            
            {/* Content */}
            {accounts.length === 0 ? (
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="w-full px-4 py-6 flex flex-col items-center justify-center gap-1.5 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">{t('settings.addAccount')}</span>
              </button>
            ) : (
              <div>
                {accounts.map((account, index) => (
                  <div 
                    key={account.id} 
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5",
                      index !== accounts.length - 1 && "border-b border-[rgb(var(--border-secondary))]"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center text-[rgb(var(--text-secondary))] flex-shrink-0">
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                        {account.name}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] capitalize">
                        {t(`settings.${account.type}`)}
                      </p>
                    </div>
                    <p 
                      className={cn(
                        "text-base font-bold tabular-nums flex-shrink-0",
                        Number(account.balance) >= 0 
                          ? "text-[rgb(var(--text-primary))]" 
                          : "text-negative"
                      )}
                      dir="ltr"
                    >
                      {formatCurrency(Number(account.balance), { locale: localeString, symbol: currencySymbol })}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="w-full px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-tertiary))] border-t border-[rgb(var(--border-secondary))] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="font-medium">{t('settings.addAccount')}</span>
                </button>
              </div>
            )}
          </section>

          {/* ============================================
              FIRST-TIME USER GUIDANCE - Full width
              ============================================ */}
          {isNewUser && (
            <section className="col-span-12 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
                    {t('dashboard.welcomeTitle')}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('dashboard.welcomeDescription')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAccountModalOpen(true)}
                    className="flex-1 lg:flex-none py-2.5 px-4 bg-[rgb(var(--accent))] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    {t('settings.addAccount')}
                  </button>
                  <button
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="flex-1 lg:flex-none py-2.5 px-4 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] rounded-lg text-sm font-medium hover:bg-[rgb(var(--border-primary))] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('dashboard.addTransaction')}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ============================================
              INSIGHTS SECTION - 4 cards grid
              ============================================ */}
          {hasInsights && !isNewUser && (
            <>
              {/* Insights Header */}
              <div className="col-span-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[rgb(var(--accent))]" />
                  <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    {t('insights.title') || 'Insights'}
                  </h2>
                </div>
                <Link 
                  href="/analytics" 
                  className="text-xs text-[rgb(var(--accent))] hover:underline flex items-center gap-0.5"
                >
                  {t('dashboard.viewAll')}
                  <ChevronRight className={cn("w-3.5 h-3.5", isRTL && "rtl-flip")} />
                </Link>
              </div>

              {/* 1️⃣ Spending by Category (mini) */}
              {topCategories.length > 0 && (
                <Link 
                  href="/analytics"
                  className="col-span-12 sm:col-span-6 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 hover:border-[rgb(var(--accent))] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {t('insights.topCategories') || 'Top Categories'}
                      </span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--accent))]", isRTL && "rtl-flip")} />
                  </div>
                  
                  {/* Mini bar chart */}
                  <div className="space-y-2">
                    {topCategories.slice(0, 3).map((cat, i) => {
                      const maxAmount = topCategories[0]?.amount || 1
                      const percentage = (cat.amount / maxAmount) * 100
                      return (
                        <div key={cat.id} className="flex items-center gap-2">
                          <span className="text-sm w-5">{cat.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-[rgb(var(--text-secondary))] truncate max-w-[80px]">{cat.name}</span>
                              <span className="text-xs font-medium tabular-nums text-[rgb(var(--text-primary))]" dir="ltr">
                                {currencySymbol}{cat.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[rgb(var(--accent))] rounded-full transition-all"
                                style={{ width: `${percentage}%`, opacity: 1 - (i * 0.25) }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Link>
              )}

              {/* 2️⃣ Month vs Last Month */}
              {hasLastMonthData && (
                <div className="col-span-12 sm:col-span-6 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isSpendingMore ? "bg-negative-subtle" : "bg-positive-subtle"
                    )}>
                      {isSpendingMore 
                        ? <TrendingUp className="w-4 h-4 text-negative" />
                        : <TrendingDown className="w-4 h-4 text-positive" />
                      }
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {t('insights.monthComparison') || 'vs Last Month'}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={cn(
                      "text-2xl font-bold tabular-nums",
                      isSpendingMore ? "text-negative" : "text-positive"
                    )}>
                      {isSpendingMore ? '+' : ''}{monthDifference.toFixed(0)}%
                    </span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      {isSpendingMore 
                        ? (t('insights.spentMore') || 'spent more')
                        : (t('insights.spentLess') || 'spent less')
                      }
                    </span>
                  </div>
                  
                  <div className="text-xs text-[rgb(var(--text-tertiary))]">
                    <span dir="ltr">{currencySymbol}{totalExpenses.toLocaleString()}</span>
                    {' vs '}
                    <span dir="ltr">{currencySymbol}{lastMonthExpenses.toLocaleString()}</span>
                    {' ' + (t('insights.lastMonth') || 'last month')}
                  </div>
                </div>
              )}

              {/* 3️⃣ Over Budget Alerts */}
              {budgetAlerts.length > 0 && (
                <Link 
                  href="/budget"
                  className="col-span-12 sm:col-span-6 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 hover:border-[rgb(var(--warning))] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-warning-subtle flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {t('insights.budgetAlerts') || 'Budget Alerts'}
                      </span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--warning))]", isRTL && "rtl-flip")} />
                  </div>
                  
                  <div className="space-y-2">
                    {budgetAlerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center gap-2">
                        <span className="text-sm">{alert.categoryIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[rgb(var(--text-secondary))] truncate">
                            {alert.categoryName}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs font-medium",
                          alert.isOver ? "text-negative" : "text-warning"
                        )}>
                          {alert.isOver 
                            ? (t('budget.over') || 'Over budget')
                            : `${currencySymbol}${alert.remaining.toLocaleString()} ${t('budget.remaining') || 'left'}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              )}

              {/* 4️⃣ Biggest Expense This Month */}
              {biggestExpense && (
                <Link 
                  href="/transactions"
                  className="col-span-12 sm:col-span-6 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 hover:border-[rgb(var(--accent))] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-negative-subtle flex items-center justify-center">
                        <Zap className="w-4 h-4 text-negative" />
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {t('insights.biggestExpense') || 'Biggest Expense'}
                      </span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--accent))]", isRTL && "rtl-flip")} />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {biggestExpense.category?.icon && (
                      <span className="text-2xl">{biggestExpense.category.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                        {biggestExpense.description}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {biggestExpense.category?.name || t('transactions.uncategorized')}
                      </p>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-negative flex-shrink-0" dir="ltr">
                      {currencySymbol}{Number(biggestExpense.amount).toLocaleString()}
                    </p>
                  </div>
                </Link>
              )}
            </>
          )}

          {/* ============================================
              RECENT TRANSACTIONS - Full width on mobile, 8 cols on desktop
              ============================================ */}
          <section className="col-span-12 lg:col-span-8 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {t('dashboard.recentTransactions')}
                </h2>
              </div>
              {recentTransactions.length > 0 && (
                <Link 
                  href="/transactions" 
                  className="text-xs text-[rgb(var(--accent))] hover:underline flex items-center gap-0.5"
                >
                  {t('dashboard.viewAll')}
                  <ChevronRight className={cn("w-3.5 h-3.5", isRTL && "rtl-flip")} />
                </Link>
              )}
            </div>
            
            {/* Content */}
            {hasNoTransactions ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">
                  {t('dashboard.noTransactions')}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mb-3">
                  {t('dashboard.startAdding')}
                </p>
                <button
                  onClick={() => setIsTransactionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-[rgb(var(--accent))] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  {t('dashboard.addTransaction')}
                </button>
              </div>
            ) : (
              <div>
                {recentTransactions.slice(0, 6).map((transaction, index) => (
                  <Link
                    key={transaction.id}
                    href="/transactions"
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                      index !== Math.min(recentTransactions.length - 1, 5) && "border-b border-[rgb(var(--border-secondary))]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      transaction.type === 'income' 
                        ? "bg-positive-subtle text-positive" 
                        : "bg-negative-subtle text-negative"
                    )}>
                      {transaction.type === 'income' 
                        ? <ArrowUpRight className="w-4 h-4" />
                        : <ArrowDownRight className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {new Date(transaction.date).toLocaleDateString(localeString, { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                        {transaction.category && ` · ${transaction.category.name}`}
                      </p>
                    </div>
                    <p 
                      className={cn(
                        "font-semibold text-sm tabular-nums flex-shrink-0",
                        transaction.type === 'income' ? "text-positive" : "text-negative"
                      )}
                      dir="ltr"
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount), { locale: localeString, symbol: currencySymbol })}
                    </p>
                  </Link>
                ))}
                <Link
                  href="/transactions"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-tertiary))] border-t border-[rgb(var(--border-secondary))] transition-colors"
                >
                  {t('dashboard.viewAll')}
                  <ChevronRight className={cn("w-3.5 h-3.5", isRTL && "rtl-flip")} />
                </Link>
              </div>
            )}
          </section>

          {/* ============================================
              QUICK ACTIONS SIDEBAR - 4 cols on desktop
              ============================================ */}
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            {/* Goals Card */}
            {goals.length > 0 && (
              <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      {t('nav.goals')}
                    </h3>
                  </div>
                  <Link 
                    href="/goals" 
                    className="text-xs text-[rgb(var(--accent))] hover:underline"
                  >
                    {t('dashboard.viewAll')}
                  </Link>
                </div>
                <div className="divide-y divide-[rgb(var(--border-secondary))]">
                  {goals.map((goal) => {
                    const progress = goal.targetAmount > 0 
                      ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 
                      : 0
                    const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
                    
                    return (
                      <Link
                        key={goal.id}
                        href="/goals"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                      >
                        <span className="text-xl">{goal.icon || '🎯'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                            {goal.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[rgb(var(--accent))] rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] tabular-nums">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link
                  href="/goals"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-tertiary))] border-t border-[rgb(var(--border-secondary))] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('goals.addGoal') || 'Add Goal'}
                </Link>
              </div>
            )}

            {/* Income CTA */}
            {!isNewUser && totalIncome === 0 && accounts.length > 0 && (
              <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-positive-subtle flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-positive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-0.5">
                      {t('dashboard.noIncomeYet')}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mb-3">
                      {t('dashboard.addSalaryHint')}
                    </p>
                    <button
                      onClick={() => setIsRecurringIncomeModalOpen(true)}
                      className="w-full py-2 px-4 bg-[rgb(var(--accent))] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {t('dashboard.addSalary')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {t('nav.more') || 'Quick Links'}
                </h3>
              </div>
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                <Link
                  href="/budget"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  <span className="text-sm text-[rgb(var(--text-primary))]">{t('nav.budget')}</span>
                  <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))]", isRTL && "rtl-flip")} />
                </Link>
                <Link
                  href="/goals"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  <span className="text-sm text-[rgb(var(--text-primary))]">{t('nav.goals')}</span>
                  <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))]", isRTL && "rtl-flip")} />
                </Link>
                <Link
                  href="/analytics"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  <span className="text-sm text-[rgb(var(--text-primary))]">{t('nav.analytics')}</span>
                  <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))]", isRTL && "rtl-flip")} />
                </Link>
                <Link
                  href="/credit-cards"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">{t('creditCards.title')}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-[rgb(var(--text-tertiary))]", isRTL && "rtl-flip")} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <RecurringIncomeModal
        isOpen={isRecurringIncomeModalOpen}
        onClose={() => setIsRecurringIncomeModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={() => window.location.reload()}
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

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
