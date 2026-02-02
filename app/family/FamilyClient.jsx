'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, 
  Mail, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  X,
  UserPlus,
  Settings,
  TrendingUp,
  Target,
  Receipt,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function FamilyClient() {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch household data
  useEffect(() => {
    fetchHousehold()
  }, [])

  const fetchHousehold = async () => {
    try {
      const response = await fetch('/api/households')
      if (!response.ok) {
        // If 401, user is not authenticated - that's fine, just set to null
        if (response.status === 401) {
          setHousehold(null)
          return
        }
        // For other errors, log but don't throw
        console.error('Failed to fetch household:', response.status, response.statusText)
        setHousehold(null)
        return
      }
      const data = await response.json()
      setHousehold(data.household)
    } catch (error) {
      console.error('Error fetching household:', error)
      setHousehold(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHousehold = async () => {
    showLoading()
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${t('family.household')}` }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || 'Failed to create household'
        // If user already belongs to a household, refresh to show it
        if (errorMessage.includes('already belongs')) {
          try {
            await fetchHousehold()
          } catch (e) {
            // Ignore fetch errors, just show the message
            console.error('Error refreshing household:', e)
          }
          toast.info(t('family.alreadyMember'), errorMessage)
          return
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setHousehold(data.household)
      toast.success(t('family.created'), t('family.createdSuccess'))
    } catch (error) {
      toast.error(t('family.createFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail && !inviteLink) return

    showLoading()
    try {
      const response = await fetch('/api/households/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail || undefined, 
          inviteLink: !inviteEmail,
          locale: localeString?.split('-')[0] || 'en', // Pass locale for email language
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      const data = await response.json()
      if (data.inviteLink) {
        setInviteLink(data.inviteLink)
      }
      
      // Show appropriate message based on whether email was sent
      if (data.emailSent) {
        toast.success(t('family.inviteSent'), t('family.emailSentTo', { email: inviteEmail }))
      } else if (data.emailError) {
        toast.warning(t('family.inviteCreated'), t('family.emailFailed'))
      } else {
        toast.success(t('family.inviteSent'), t('family.inviteSentSuccess'))
      }
      
      setIsInviteModalOpen(false)
      setInviteEmail('')
      fetchHousehold() // Refresh to see pending invitations
    } catch (error) {
      toast.error(t('family.inviteFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleCopyLink = () => {
    const link = inviteLink || (household ? `${window.location.origin}/family/accept?token=${household.inviteToken}` : '')
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('common.copied'), t('common.copiedSuccess'))
  }

  const handleLeaveHousehold = async () => {
    if (!confirm(t('family.confirmLeave'))) return

    showLoading()
    try {
      const response = await fetch('/api/households/leave', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to leave household')
      }

      setHousehold(null)
      toast.success(t('family.left'), t('family.leftSuccess'))
    } catch (error) {
      toast.error(t('family.leaveFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    )
  }

  // No household - show create screen
  if (!household) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4">
        <Card className="p-6 sm:p-8 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-light-accent dark:text-dark-accent" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">
            {t('family.welcome')}
          </h1>
          <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {t('family.welcomeDescription')}
          </p>
          <Button onClick={handleCreateHousehold} className="mx-auto w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            {t('family.createHousehold')}
          </Button>
        </Card>
      </div>
    )
  }

  // Has household - show tabs
  const tabs = [
    { id: 'dashboard', label: t('family.tabs.dashboard'), icon: BarChart3 },
    { id: 'transactions', label: t('family.tabs.transactions'), icon: Receipt },
    { id: 'budget', label: t('family.tabs.budget'), icon: Target },
    { id: 'goals', label: t('family.tabs.goals'), icon: TrendingUp },
    { id: 'settings', label: t('family.tabs.settings'), icon: Settings },
  ]

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {household.name}
          </h1>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            {t('family.membersCount', { count: household.members.length })}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsInviteModalOpen(true)}
          disabled={household.members.length >= 6}
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('family.inviteMember')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-light-border dark:border-dark-border overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent'
                    : 'border-transparent text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-secondary dark:hover:text-dark-text-secondary'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <FamilyDashboard household={household} />
        )}
        {activeTab === 'transactions' && (
          <FamilyTransactions household={household} />
        )}
        {activeTab === 'budget' && (
          <FamilyBudget household={household} />
        )}
        {activeTab === 'goals' && (
          <FamilyGoals household={household} />
        )}
        {activeTab === 'settings' && (
          <FamilySettings household={household} onLeave={handleLeaveHousehold} />
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false)
          setInviteEmail('')
          setInviteLink('')
        }}
        title={t('family.inviteMember')}
      >
        <div className="p-4 sm:p-6 space-y-4">
          <Input
            label={t('family.inviteEmail')}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="example@email.com"
          />

          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
              {t('family.orShareLink')}
            </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={inviteLink || (household ? `${window.location.origin}/family/accept?token=${household.inviteToken}` : '')}
              readOnly
              className="flex-1 text-xs sm:text-base"
            />
            <Button
              variant="secondary"
              onClick={handleCopyLink}
              className="flex-shrink-0 w-full sm:w-auto"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsInviteModalOpen(false)
                setInviteEmail('')
                setInviteLink('')
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleInvite}
              disabled={!inviteEmail && !inviteLink}
            >
              {t('family.sendInvite')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Placeholder components for tabs
function FamilyDashboard({ household }) {
  const { t, currencySymbol, localeString: locale } = useI18n()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!household) return

    // Get current month
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
          net: totalIncome - totalExpenses,
          count: transactions.length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [household])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4">
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('dashboard.expenses')}
            </p>
            <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {formatCurrency(stats.totalExpenses, { locale, symbol: currencySymbol })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('dashboard.income')}
            </p>
            <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {formatCurrency(stats.totalIncome, { locale, symbol: currencySymbol })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('dashboard.net')}
            </p>
            <p className={cn(
              "text-2xl font-bold",
              stats.net >= 0 
                ? "text-light-success dark:text-dark-success"
                : "text-light-danger dark:text-dark-danger"
            )}>
              {formatCurrency(Math.abs(stats.net), { locale, symbol: currencySymbol })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              {t('transactions.transactionsCount')}
            </p>
            <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {stats.count}
            </p>
          </Card>
        </div>
      )}
      <Card className="p-6">
        <EmptyState
          icon={<BarChart3 className="w-8 h-8" />}
          title={t('family.comingSoon')}
          description={t('family.dashboardComingSoon')}
        />
      </Card>
    </div>
  )
}

function FamilyTransactions({ household }) {
  const { t, currencySymbol, localeString: locale } = useI18n()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!household) return

    fetch('/api/transactions?onlyShared=true')
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [household])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={t('family.noSharedTransactions')}
          description={t('family.noSharedTransactionsDescription')}
        />
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                {transaction.description}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
                {transaction.category && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${transaction.category.color}20`,
                      color: transaction.category.color,
                    }}
                  >
                    {transaction.category.name}
                  </span>
                )}
                {transaction.isShared && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent">
                    {t('transactions.shared')}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-4 text-right flex-shrink-0">
              <p className={cn(
                "font-semibold",
                transaction.type === 'income'
                  ? "text-light-success dark:text-dark-success"
                  : "text-light-danger dark:text-dark-danger"
              )}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, { locale, symbol: currencySymbol })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function FamilyBudget({ household }) {
  const { t } = useI18n()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!household) return

    // Fetch shared budgets
    fetch('/api/budgets')
      .then(res => res.json())
      .then(data => {
        // Filter for shared budgets (would need API support)
        setBudgets([])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [household])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <EmptyState
        icon={<Target className="w-8 h-8" />}
        title={t('family.comingSoon')}
        description={t('family.budgetComingSoon')}
      />
    </Card>
  )
}

function FamilyGoals({ household }) {
  const { t } = useI18n()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!household) return

    // Fetch shared goals
    fetch('/api/goals')
      .then(res => res.json())
      .then(data => {
        // Filter for shared goals (would need API support)
        setGoals([])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [household])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <EmptyState
        icon={<TrendingUp className="w-8 h-8" />}
        title={t('family.comingSoon')}
        description={t('family.goalsComingSoon')}
      />
    </Card>
  )
}

function FamilySettings({ household, onLeave }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
            {t('family.members')}
          </h3>
          <div className="space-y-2">
            {household.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 rounded-xl bg-light-surface dark:bg-dark-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                    {member.name || member.email}
                  </p>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    {member.role === 'owner' ? t('family.owner') : t('family.member')}
                  </p>
                </div>
                {member.role === 'owner' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent whitespace-nowrap">
                    {t('family.owner')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {household.invitations && household.invitations.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              {t('family.pendingInvitations')}
            </h3>
            <div className="space-y-2">
              {household.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 rounded-xl bg-light-surface dark:bg-dark-surface"
                >
                  <div>
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {invitation.email || t('family.linkInvitation')}
                    </p>
                    <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {t('family.invitedBy')} {invitation.invitedBy?.name || invitation.invitedBy?.email}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-light-warning/10 dark:bg-dark-warning/10 text-light-warning dark:text-dark-warning whitespace-nowrap">
                    {t('family.pending')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6">
        <div className="pt-4 sm:pt-6 border-t border-light-border dark:border-dark-border">
          <Button
            variant="secondary"
            onClick={onLeave}
            className="w-full sm:w-auto text-light-danger dark:text-dark-danger hover:bg-light-danger/10 dark:hover:bg-dark-danger/10"
          >
            <X className="w-4 h-4 mr-2" />
            {t('family.leaveHousehold')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
