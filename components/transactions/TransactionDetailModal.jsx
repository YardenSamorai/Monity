'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Calendar,
  Clock,
  Tag,
  Wallet,
  FileText,
  TrendingUp,
  Target,
  Edit,
  Trash2,
  Receipt,
  Hash,
  Users
} from 'lucide-react'

export function TransactionDetailModal({ 
  isOpen, 
  onClose, 
  transaction,
  onEdit,
  onDelete,
  currencySymbol,
  localeString
}) {
  const { t, isRTL } = useI18n()

  if (!transaction) return null

  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer'
  const isCreditCard = transaction.isCreditCard

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(localeString, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(localeString, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const DetailRow = ({ icon: Icon, label, value, valueClassName, children }) => (
    <div className="flex items-start gap-3 py-3 border-b border-[rgb(var(--border-secondary))] last:border-0">
      <div className="w-9 h-9 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-[rgb(var(--text-tertiary))]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5">{label}</p>
        {children || (
          <p className={cn("text-sm font-medium text-[rgb(var(--text-primary))]", valueClassName)}>
            {value}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('transactions.transactionDetails')}
      size="md"
    >
      <div className="space-y-4">
        {/* Header - Amount & Type */}
        <div className={cn(
          "rounded-xl p-5 text-center",
          isIncome 
            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20"
            : isTransfer
            ? "bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20"
            : isCreditCard
            ? "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20"
            : "bg-gradient-to-br from-rose-500/10 to-rose-600/10 border border-rose-500/20"
        )}>
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center",
            isIncome 
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
              : isTransfer
              ? "bg-gradient-to-br from-blue-400 to-blue-600"
              : isCreditCard
              ? "bg-gradient-to-br from-purple-400 to-purple-600"
              : "bg-gradient-to-br from-rose-400 to-rose-600"
          )}>
            {isIncome ? (
              <ArrowUpCircle className="w-7 h-7 text-white" />
            ) : isTransfer ? (
              <TrendingUp className="w-7 h-7 text-white" />
            ) : isCreditCard ? (
              <CreditCard className="w-7 h-7 text-white" />
            ) : (
              <ArrowDownCircle className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Type Badge */}
          <Badge 
            variant={isIncome ? 'success' : isTransfer ? 'info' : 'destructive'}
            className="mb-2"
          >
            {isIncome ? t('transactions.income') : isTransfer ? t('transactions.transfer') : t('transactions.expense')}
          </Badge>

          {/* Amount */}
          <p 
            className={cn(
              "text-3xl font-bold tabular-nums",
              isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
            dir="ltr"
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(Number(transaction.amount), { locale: localeString, symbol: currencySymbol })}
          </p>

          {/* Description */}
          <p className="text-lg font-medium text-[rgb(var(--text-primary))] mt-2">
            {transaction.description}
          </p>
        </div>

        {/* Details List */}
        <div className="bg-[rgb(var(--bg-secondary))] rounded-xl px-4">
          {/* Date */}
          <DetailRow 
            icon={Calendar} 
            label={t('transactions.transactionDate')}
            value={formatDate(transaction.date)}
          />

          {/* Time (if available from createdAt) */}
          {transaction.createdAt && (
            <DetailRow 
              icon={Clock} 
              label={t('transactions.createdAt')}
              value={formatDate(transaction.createdAt) + ' • ' + formatTime(transaction.createdAt)}
            />
          )}

          {/* Account */}
          <DetailRow 
            icon={Wallet} 
            label={t('transactions.account')}
            value={transaction.account?.name || '-'}
          />

          {/* Category */}
          {transaction.category && (
            <DetailRow 
              icon={Tag} 
              label={t('transactions.category')}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: transaction.category.color || '#888' }}
                />
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {transaction.category.icon} {transaction.category.name}
                </span>
              </div>
            </DetailRow>
          )}

          {/* Credit Card Info */}
          {isCreditCard && (
            <>
              <DetailRow 
                icon={CreditCard} 
                label={t('transactions.creditCard')}
                value={transaction.creditCardName || transaction.account?.name || '-'}
              />
              <DetailRow 
                icon={Receipt} 
                label={t('transactions.chargeStatus')}
              >
                <Badge 
                  variant={transaction.creditCardStatus === 'pending' ? 'warning' : 'default'}
                  className="mt-0.5"
                >
                  {transaction.creditCardStatus === 'pending' 
                    ? t('creditCards.statusPending') 
                    : t('creditCards.statusBilled')}
                </Badge>
              </DetailRow>
              {transaction.billingDate && (
                <DetailRow 
                  icon={Calendar} 
                  label={t('transactions.billingDate')}
                  value={formatDate(transaction.billingDate)}
                />
              )}
            </>
          )}

          {/* Linked Goal */}
          {transaction.savingsGoal && (
            <DetailRow 
              icon={Target} 
              label={t('transactions.linkedGoal')}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  🎯 {transaction.savingsGoal.name}
                </span>
              </div>
            </DetailRow>
          )}

          {/* Shared Transaction */}
          {transaction.isShared && (
            <DetailRow 
              icon={Users} 
              label={t('transactions.sharedTransaction')}
            >
              <Badge variant="info" className="mt-0.5">
                {t('family.sharedWithFamily')}
              </Badge>
            </DetailRow>
          )}

          {/* Notes */}
          {transaction.notes && (
            <DetailRow 
              icon={FileText} 
              label={t('transactions.notes')}
              value={transaction.notes}
            />
          )}

          {/* Transaction ID */}
          <DetailRow 
            icon={Hash} 
            label={t('transactions.transactionId')}
            value={transaction.id}
            valueClassName="text-xs font-mono text-[rgb(var(--text-tertiary))] break-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onClose()
              onEdit?.(transaction)
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => {
              onClose()
              onDelete?.(transaction)
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
