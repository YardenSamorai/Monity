'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  TrendingUp, 
  PieChart, 
  Users,
  Award,
  Folder,
  Percent
} from 'lucide-react'

export function InsightsCard({ household }) {
  const { t, currencySymbol, localeString } = useI18n()
  const [insights, setInsights] = useState(null)
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
        
        // Calculate insights
        const spendingByUser = {}
        const spendingByCategory = {}
        
        expenses.forEach(t => {
          // By user
          const userId = t.userId
          if (!spendingByUser[userId]) {
            spendingByUser[userId] = { spent: 0, name: null }
          }
          spendingByUser[userId].spent += Number(t.amount)
          
          // By category
          const catName = t.category?.name || 'Uncategorized'
          const catColor = t.category?.color || '#6b7280'
          if (!spendingByCategory[catName]) {
            spendingByCategory[catName] = { amount: 0, color: catColor }
          }
          spendingByCategory[catName].amount += Number(t.amount)
        })

        // Find top spender
        let topSpender = null
        let maxSpent = 0
        Object.entries(spendingByUser).forEach(([userId, data]) => {
          if (data.spent > maxSpent) {
            maxSpent = data.spent
            const member = household.members.find(m => m.userId === userId)
            topSpender = {
              name: member?.name || member?.email?.split('@')[0] || 'Unknown',
              spent: data.spent,
              isCurrentUser: member?.isCurrentUser,
            }
          }
        })

        // Find top category
        let topCategory = null
        let maxCatSpent = 0
        Object.entries(spendingByCategory).forEach(([name, data]) => {
          if (data.amount > maxCatSpent) {
            maxCatSpent = data.amount
            topCategory = {
              name,
              amount: data.amount,
              color: data.color,
            }
          }
        })

        // Calculate contribution ratio
        const totalSalaries = household.members.reduce((sum, m) => sum + (Number(m.monthlySalary) || 0), 0)
        const contributionRatios = household.members.map(m => ({
          name: m.name || m.email?.split('@')[0],
          ratio: totalSalaries > 0 ? Math.round(((Number(m.monthlySalary) || 0) / totalSalaries) * 100) : 0,
          isCurrentUser: m.isCurrentUser,
        })).filter(m => m.ratio > 0)

        setInsights({
          topSpender,
          topCategory,
          contributionRatios,
          totalExpenses: expenses.reduce((sum, t) => sum + Number(t.amount), 0),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [household])

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-5 w-32 bg-[rgb(var(--bg-tertiary))] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded" />
          <div className="h-16 bg-[rgb(var(--bg-tertiary))] rounded" />
        </div>
      </Card>
    )
  }

  const insightItems = [
    insights?.topSpender && {
      icon: Award,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: t('family.topSpender'),
      value: insights.topSpender.name,
      subtitle: formatCurrency(insights.topSpender.spent, { locale: localeString, symbol: currencySymbol }),
      badge: insights.topSpender.isCurrentUser ? t('family.you') : null,
    },
    insights?.topCategory && {
      icon: Folder,
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('family.topCategory'),
      value: insights.topCategory.name,
      subtitle: formatCurrency(insights.topCategory.amount, { locale: localeString, symbol: currencySymbol }),
      color: insights.topCategory.color,
    },
  ].filter(Boolean)

  const totalHouseholdIncome = household.totalHouseholdIncome || 0
  const budgetUsedPercent = totalHouseholdIncome > 0 && insights
    ? Math.round((insights.totalExpenses / totalHouseholdIncome) * 100)
    : 0

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--border-primary))]">
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">
          {t('family.insights')}
        </h3>
      </div>

      {/* Budget Progress */}
      <div className="p-4 border-b border-[rgb(var(--border-primary))]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[rgb(var(--text-secondary))]">
            {t('family.budgetProgress')}
          </span>
          <span className={cn(
            "text-sm font-medium",
            budgetUsedPercent >= 80 ? "text-amber-600 dark:text-amber-400" : "text-[rgb(var(--text-primary))]"
          )}>
            {budgetUsedPercent}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              budgetUsedPercent >= 80 ? "bg-amber-500" : "bg-blue-500"
            )}
            style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
          />
        </div>
        {budgetUsedPercent >= 80 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            {t('family.budgetWarning', { percent: budgetUsedPercent })}
          </p>
        )}
      </div>

      {/* Insights List */}
      {insightItems.length > 0 ? (
        <div className="divide-y divide-[rgb(var(--border-primary))]">
          {insightItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-medium text-[rgb(var(--text-primary))]">
                        {item.value}
                      </p>
                      {item.badge && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {t('family.noInsightsYet')}
          </p>
        </div>
      )}

      {/* Contribution Ratios */}
      {insights?.contributionRatios?.length > 0 && (
        <div className="p-4 border-t border-[rgb(var(--border-primary))]">
          <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] mb-3 uppercase tracking-wide">
            {t('family.contributionRatio')}
          </p>
          <div className="flex gap-2">
            {insights.contributionRatios.map((member, i) => (
              <div 
                key={i}
                className="flex-1 p-2 rounded-lg bg-[rgb(var(--bg-tertiary))] text-center"
              >
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
                  {member.ratio}%
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
                  {member.isCurrentUser ? t('family.you') : member.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
