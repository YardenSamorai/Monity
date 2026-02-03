'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowRight } from 'lucide-react'

export function FamilyOverview({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    fetch(`/api/transactions?onlyShared=true&startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
      .then(res => res.json())
      .then(data => {
        const transactions = data.transactions || []
        const expenses = transactions.filter(t => t.type === 'expense')
        const income = transactions.filter(t => t.type === 'income')
        const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
        const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
        
        setStats({
          totalExpenses,
          totalIncome,
          netBalance: totalIncome - totalExpenses,
          transactionCount: transactions.length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalHouseholdIncome = household.totalHouseholdIncome || 0
  const budgetUsed = totalHouseholdIncome > 0 && stats 
    ? Math.min(Math.round((stats.totalExpenses / totalHouseholdIncome) * 100), 100)
    : 0

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-20 bg-[rgb(var(--bg-tertiary))] rounded mb-2" />
            <div className="h-8 w-28 bg-[rgb(var(--bg-tertiary))] rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: t('family.monthlyIncome'),
      value: formatCurrency(stats?.totalIncome || 0, { locale: localeString, symbol: currencySymbol }),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('family.monthlyExpenses'),
      value: formatCurrency(stats?.totalExpenses || 0, { locale: localeString, symbol: currencySymbol }),
      icon: TrendingDown,
      iconBg: 'bg-rose-50 dark:bg-rose-900/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      valueColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: t('family.netBalance'),
      value: formatCurrency(stats?.netBalance || 0, { locale: localeString, symbol: currencySymbol }),
      icon: Wallet,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: stats?.netBalance >= 0 
        ? 'text-emerald-600 dark:text-emerald-400' 
        : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: t('family.budgetUsed'),
      value: `${budgetUsed}%`,
      icon: PieChart,
      iconBg: budgetUsed >= 80 
        ? 'bg-amber-50 dark:bg-amber-900/20' 
        : 'bg-slate-50 dark:bg-slate-800/50',
      iconColor: budgetUsed >= 80 
        ? 'text-amber-600 dark:text-amber-400' 
        : 'text-slate-600 dark:text-slate-400',
      valueColor: budgetUsed >= 80 
        ? 'text-amber-600 dark:text-amber-400' 
        : 'text-[rgb(var(--text-primary))]',
      subtitle: budgetUsed >= 80 ? t('family.nearingLimit') : null,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">
                {card.label}
              </p>
              <p className={`text-xl font-bold ${card.valueColor}`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {card.subtitle}
                </p>
              )}
            </Card>
          )
        })}
      </div>
      
      {/* View All Transactions Link */}
      <Link 
        href="/family/transactions"
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
      >
        <span className="text-sm font-medium">{t('family.viewAllTransactions')}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
