'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  Tag,
  MoreVertical,
  Edit2,
  Trash2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Plane,
  GraduationCap,
  Briefcase,
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

export function TransactionRow({ 
  transaction, 
  household, 
  currencySymbol, 
  localeString,
  onEdit,
  onDelete,
  onView,
  variant = 'detailed', // 'simple' | 'detailed'
  showActions = true,
}) {
  const { t } = useI18n()
  const [showMenu, setShowMenu] = useState(false)
  
  const member = household?.members?.find(m => m.userId === transaction.userId)
  const isIncome = transaction.type === 'income'
  const isExpense = transaction.type === 'expense'

  const getAvatarColor = (id) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-cyan-500',
    ]
    const index = household?.members?.findIndex(m => m.userId === id) ?? 0
    return colors[index % colors.length]
  }

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    if (email) return email[0].toUpperCase()
    return '?'
  }

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

  const CategoryIcon = transaction.category?.icon 
    ? categoryIcons[transaction.category.icon] || Receipt
    : Receipt

  if (variant === 'simple') {
    // Simple variant - like TransactionsCard
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-colors",
          onView && "hover:bg-[rgb(var(--bg-tertiary))] cursor-pointer",
          !onView && "hover:bg-[rgb(var(--bg-tertiary))]"
        )}
        onClick={() => onView?.(transaction)}
      >
        {/* Member Avatar */}
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
            getAvatarColor(transaction.userId)
          )}>
            {getInitials(member?.name, member?.email)}
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
            <span>{member?.name || member?.email?.split('@')[0] || t('family.unknownMember')}</span>
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
  }

  // Detailed variant - like FamilyTransactionsClient
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
        onView && "cursor-pointer"
      )}
      onClick={() => onView?.(transaction)}
    >
      {/* Category Icon */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ 
          backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : 'rgb(var(--bg-tertiary))',
          color: transaction.category?.color || 'rgb(var(--text-tertiary))'
        }}
      >
        <CategoryIcon className="w-5 h-5" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--text-primary))] truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {/* Member */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium",
              getAvatarColor(member?.id || transaction.userId)
            )}>
              {getInitials(member?.name, member?.email)}
            </div>
            <span className="text-xs text-[rgb(var(--text-tertiary))]">
              {member?.name || member?.email?.split('@')[0] || t('family.unknownMember')}
            </span>
          </div>
          
          {/* Category Badge */}
          {transaction.category && (
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${transaction.category.color}20`,
                color: transaction.category.color
              }}
            >
              {transaction.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Date & Amount */}
      <div className="text-end">
        <p className={cn(
          "font-semibold",
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        )}>
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
          {new Date(transaction.date).toLocaleDateString(localeString, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Type Badge */}
      <span className={cn(
        "text-xs px-2 py-1 rounded-full font-medium hidden sm:inline-flex",
        isIncome 
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
      )}>
        {isIncome ? t('transactions.income') : t('transactions.expense')}
      </span>

      {/* Actions Menu */}
      {showActions && (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute end-0 top-full mt-1 z-20 w-40 bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] shadow-lg overflow-hidden">
                {onEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit(transaction)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                )}
                {onView && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onView(transaction)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                  >
                    <History className="w-4 h-4" />
                    {t('common.viewDetails')}
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete(transaction)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
