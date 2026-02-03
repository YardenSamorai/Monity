'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  ArrowRight,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Plane,
  GraduationCap,
  Briefcase,
  MoreHorizontal
} from 'lucide-react'

// Category icons mapping
const categoryIcons = {
  shopping: ShoppingBag,
  food: Utensils,
  transport: Car,
  housing: Home,
  utilities: Zap,
  health: Heart,
  travel: Plane,
  education: GraduationCap,
  work: Briefcase,
}

export function TransactionsCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions?onlyShared=true&limit=5')
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return t('common.today') || 'היום'
    if (diffDays === 1) return t('common.yesterday') || 'אתמול'
    if (diffDays < 7) return `${diffDays} ${t('common.days')}`
    
    return date.toLocaleDateString(localeString, { 
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-tertiary))]" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[rgb(var(--bg-tertiary))] rounded mb-2" />
                <div className="h-3 w-20 bg-[rgb(var(--bg-tertiary))] rounded" />
              </div>
              <div className="h-5 w-16 bg-[rgb(var(--bg-tertiary))] rounded" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
          <h3 className="font-semibold text-[rgb(var(--text-primary))]">
            {t('family.recentTransactions')}
          </h3>
        </div>
        <Link 
          href="/family/transactions"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          {t('common.viewAll') || 'הכל'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
            <Receipt className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
          </div>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t('family.noSharedTransactions')}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((transaction, index) => {
            const isExpense = transaction.type === 'expense'
            const CategoryIcon = transaction.category?.icon 
              ? categoryIcons[transaction.category.icon] || Receipt
              : Receipt
            
            return (
              <div 
                key={transaction.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  "hover:bg-[rgb(var(--bg-tertiary))]"
                )}
              >
                {/* Member Avatar */}
                <div className="relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
                    getMemberColor(transaction.userId)
                  )}>
                    {getMemberInitials(transaction.userId)}
                  </div>
                  {/* Transaction type indicator */}
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center",
                    isExpense 
                      ? "bg-rose-100 dark:bg-rose-900/50" 
                      : "bg-emerald-100 dark:bg-emerald-900/50"
                  )}>
                    {isExpense ? (
                      <ArrowDownRight className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <ArrowUpRight className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-tertiary))]">
                    <span>{getMemberName(transaction.userId)}</span>
                    <span>•</span>
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.category && (
                      <>
                        <span>•</span>
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ 
                            backgroundColor: `${transaction.category.color}20`,
                            color: transaction.category.color
                          }}
                        >
                          {transaction.category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className={cn(
                  "text-sm font-semibold whitespace-nowrap",
                  isExpense 
                    ? "text-rose-600 dark:text-rose-400" 
                    : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {isExpense ? '-' : '+'}
                  {formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View All Link - Bottom */}
      {transactions.length > 0 && (
        <Link 
          href="/family/transactions"
          className="flex items-center justify-center gap-2 mt-4 p-3 rounded-xl bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-quaternary))] transition-colors text-sm font-medium"
        >
          {t('family.viewAllTransactions')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </Card>
  )
}
