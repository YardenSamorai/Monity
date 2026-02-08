'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Users, 
  ArrowRight,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export function FamilyCard() {
  const { t, currencySymbol, localeString } = useI18n()
  const [household, setHousehold] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFamilyData = useCallback(async () => {
    try {
      const [householdRes, transactionsRes] = await Promise.all([
        fetch('/api/households', { cache: 'no-store' }),
        fetch('/api/transactions?onlyShared=true&limit=3', { cache: 'no-store' }),
      ])
      
      if (householdRes.ok) {
        const householdData = await householdRes.json()
        setHousehold(householdData.household)
      }
      
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching family data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFamilyData()
  }, [fetchFamilyData])

  // Real-time updates
  useDataRefresh({
    key: 'dashboard-family-card',
    fetchFn: fetchFamilyData,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.FAMILY_TRANSACTION,
      EVENTS.MEMBER_JOINED,
      EVENTS.MEMBER_LEFT,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  if (loading) {
    return (
      <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
          <div className="h-4 w-24 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-tertiary))]" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[rgb(var(--bg-tertiary))] rounded mb-1" />
                <div className="h-3 w-20 bg-[rgb(var(--bg-tertiary))] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!household) {
    return null // Don't show card if user has no household
  }

  // Find member name by userId
  const getMemberName = (userId) => {
    const member = household?.members?.find(m => m.userId === userId)
    return member?.name || member?.email?.split('@')[0] || t('family.unknownMember')
  }

  // Get member avatar initials
  const getMemberInitials = (userId) => {
    const name = getMemberName(userId)
    return name.charAt(0).toUpperCase()
  }

  // Get member avatar color
  const getMemberColor = (userId) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
    ]
    const index = household?.members?.findIndex(m => m.userId === userId) || 0
    return colors[index % colors.length]
  }

  return (
    <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[rgb(var(--accent))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {household.name || t('family.title')}
          </h3>
        </div>
        <Link 
          href="/family" 
          className="text-xs text-[rgb(var(--accent))] hover:underline"
        >
          {t('dashboard.viewAll')}
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-3">
            {t('family.noSharedTransactions')}
          </p>
          <Link
            href="/family"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-tertiary))] rounded-lg transition-colors"
          >
            {t('family.viewAllTransactions')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[rgb(var(--border-secondary))]">
            {transactions.slice(0, 3).map((transaction) => {
              const isExpense = transaction.type === 'expense'
              
              return (
                <Link
                  key={transaction.id}
                  href="/family"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  {/* Member Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs",
                      getMemberColor(transaction.userId)
                    )}>
                      {getMemberInitials(transaction.userId)}
                    </div>
                    {/* Transaction type indicator */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center",
                      isExpense 
                        ? "bg-rose-100 dark:bg-rose-900/50" 
                        : "bg-emerald-100 dark:bg-emerald-900/50"
                    )}>
                      {isExpense ? (
                        <ArrowDownRight className="w-2 h-2 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <ArrowUpRight className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {getMemberName(transaction.userId)}
                      {transaction.category && ` · ${transaction.category.name}`}
                    </p>
                  </div>

                  {/* Amount */}
                  <p className={cn(
                    "text-sm font-semibold tabular-nums flex-shrink-0",
                    isExpense ? "text-negative" : "text-positive"
                  )} dir="ltr">
                    {isExpense ? '-' : '+'}
                    {formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
                  </p>
                </Link>
              )
            })}
          </div>
          <Link
            href="/family"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-tertiary))] border-t border-[rgb(var(--border-secondary))] transition-colors"
          >
            {t('family.viewAllTransactions')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  )
}
