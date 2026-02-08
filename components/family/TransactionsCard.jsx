'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { Receipt, ArrowRight } from 'lucide-react'
import { TransactionRow } from './TransactionRow'

export function TransactionsCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    try {
      // Fetch regular shared transactions
      const [transactionsRes, creditCardsRes] = await Promise.all([
        fetch('/api/transactions?onlyShared=true&limit=10', { cache: 'no-store' }),
        fetch('/api/credit-cards', { cache: 'no-store' }),
      ])
      
      const transactionsData = await transactionsRes.json()
      const creditCardsData = await creditCardsRes.json()
      
      // Fetch shared credit card transactions
      const allCCTransactions = []
      for (const card of (creditCardsData.creditCards || [])) {
        try {
          const ccTxRes = await fetch(`/api/credit-cards/${card.id}/transactions?status=pending`, { cache: 'no-store' })
          const ccTxData = await ccTxRes.json()
          
          // Filter only shared transactions
          const sharedCCTransactions = (ccTxData.transactions || [])
            .filter(tx => tx.isShared && tx.householdId === household?.id)
            .map(tx => ({
              id: tx.id,
              type: 'expense',
              amount: tx.amount,
              description: tx.description,
              date: tx.date,
              notes: tx.notes,
              isShared: true,
              isCreditCard: true,
              creditCardStatus: tx.status,
              userId: tx.userId,
              account: {
                id: card.id,
                name: `${card.name} •••• ${card.lastFourDigits}`,
                type: 'credit',
              },
              category: tx.category,
            }))
          
          allCCTransactions.push(...sharedCCTransactions)
        } catch (error) {
          console.error(`Error fetching transactions for card ${card.id}:`, error)
        }
      }
      
      // Merge and sort all transactions by date
      const allTransactions = [
        ...(transactionsData.transactions || []),
        ...allCCTransactions,
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5) // Take top 5 most recent
      
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching family transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [household?.id])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Real-time updates for family transactions
  useDataRefresh({
    key: 'family-transactions-card',
    fetchFn: fetchTransactions,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.FAMILY_TRANSACTION,
      EVENTS.CREDIT_CARD_TRANSACTION,
      EVENTS.CREDIT_CARD_TRANSACTION_UPDATED,
      EVENTS.CREDIT_CARD_TRANSACTION_DELETED,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })


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
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              household={household}
              currencySymbol={currencySymbol}
              localeString={localeString}
              variant="simple"
              showActions={false}
              onView={(tx) => {
                // Navigate to transactions page - could be enhanced to scroll to specific transaction
                window.location.href = '/family/transactions'
              }}
            />
          ))}
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
