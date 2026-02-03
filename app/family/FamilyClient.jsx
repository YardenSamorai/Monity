'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { formatCurrency, cn } from '@/lib/utils'
import { 
  Users, 
  Copy, 
  Check, 
  X,
  UserPlus,
  Settings,
  Wallet,
  TrendingUp,
  PieChart,
  LogOut,
  Clock,
  Banknote,
  Receipt,
  Target,
  LayoutDashboard,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react'

export function FamilyClient() {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchHousehold()
  }, [])

  const fetchHousehold = async () => {
    try {
      const response = await fetch('/api/households')
      if (!response.ok) {
        if (response.status === 401) {
          setHousehold(null)
          return
        }
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
        body: JSON.stringify({ name: t('family.household') }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create household')
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
    if (!inviteEmail) {
      handleCopyLink()
      return
    }

    showLoading()
    try {
      const response = await fetch('/api/households/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail,
          locale: localeString?.split('-')[0] || 'en',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      toast.success(t('family.inviteSent'), t('family.emailSentTo', { email: inviteEmail }))
      setIsInviteModalOpen(false)
      setInviteEmail('')
      fetchHousehold()
    } catch (error) {
      toast.error(t('family.inviteFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleCopyLink = () => {
    const link = household ? `${window.location.origin}/family/accept?token=${household.inviteToken}` : ''
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('common.copied'), t('common.copiedSuccess'))
  }

  const handleLeaveHousehold = async () => {
    if (!confirm(t('family.confirmLeave'))) return

    showLoading()
    try {
      const response = await fetch('/api/households/leave', { method: 'DELETE' })
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

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm(t('family.confirmCancelInvitation'))) return

    showLoading()
    try {
      const response = await fetch(`/api/households/invite/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel invitation')
      }

      toast.success(t('family.invitationCancelled'))
      fetchHousehold()
    } catch (error) {
      toast.error(t('family.cancelInvitationFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[rgb(var(--accent))] border-t-transparent"></div>
      </div>
    )
  }

  // No household - show create screen
  if (!household) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
            {t('family.welcome')}
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mb-8">
            {t('family.welcomeDescription')}
          </p>
          <Button onClick={handleCreateHousehold} className="w-full h-12 text-base">
            <UserPlus className="w-5 h-5 me-2" />
            {t('family.createHousehold')}
          </Button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: t('family.tabs.dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('family.tabs.transactions'), icon: Receipt },
    { id: 'members', label: t('family.members'), icon: Users },
    { id: 'settings', label: t('family.tabs.settings'), icon: Settings },
  ]

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-emerald-100 text-sm">{household.name}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">
              {formatCurrency(household.totalHouseholdIncome || 0, { locale: localeString, symbol: currencySymbol })}
            </p>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              {t('family.totalMonthlyIncome')} • {household.members.length} {t('family.members')}
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="sticky top-0 z-10 bg-[rgb(var(--bg-primary))] border-b border-[rgb(var(--border-primary))]">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                    : 'border-transparent text-[rgb(var(--text-tertiary))]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <FamilyDashboard 
            household={household} 
            currencySymbol={currencySymbol} 
            localeString={localeString} 
          />
        )}
        {activeTab === 'transactions' && (
          <FamilyTransactions 
            household={household} 
            currencySymbol={currencySymbol} 
            localeString={localeString} 
          />
        )}
        {activeTab === 'members' && (
          <FamilyMembers 
            household={household} 
            currencySymbol={currencySymbol} 
            localeString={localeString}
            onUpdate={fetchHousehold}
          />
        )}
        {activeTab === 'settings' && (
          <FamilySettings 
            household={household}
            onLeave={handleLeaveHousehold}
            onCancelInvitation={handleCancelInvitation}
            localeString={localeString}
          />
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false)
          setInviteEmail('')
        }}
        title={t('family.inviteMember')}
      >
        <div className="space-y-4">
          <Input
            label={t('family.inviteEmail')}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
          />

          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
              {t('family.orShareLink')}
            </p>
            <div className="flex gap-2">
              <input
                value={`${window.location.origin}/family/accept?token=${household?.inviteToken || ''}`}
                readOnly
                className="flex-1 h-11 px-3 rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm truncate"
              />
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="flex-shrink-0 w-11 h-11 !p-0"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleInvite}
            >
              {inviteEmail ? t('family.sendInvite') : t('common.copy')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Dashboard Tab
function FamilyDashboard({ household, currencySymbol, localeString }) {
  const { t } = useI18n()
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
        setStats({
          totalExpenses: expenses.reduce((sum, t) => sum + Number(t.amount), 0),
          totalIncome: income.reduce((sum, t) => sum + Number(t.amount), 0),
          count: transactions.length,
          recentTransactions: transactions.slice(0, 5),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[rgb(var(--accent))] border-t-transparent"></div>
      </div>
    )
  }

  const totalHouseholdIncome = household.totalHouseholdIncome || 0
  const sharedExpenses = stats?.totalExpenses || 0
  const remaining = totalHouseholdIncome - sharedExpenses

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-500">
            {formatCurrency(sharedExpenses, { locale: localeString, symbol: currencySymbol })}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('family.sharedExpenses')}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCurrency(stats?.totalIncome || 0, { locale: localeString, symbol: currencySymbol })}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('family.sharedIncome')}
          </p>
        </Card>

        <Card className="p-4 col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('family.potentialSavings')}
              </p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                remaining >= 0 ? "text-blue-500" : "text-rose-500"
              )}>
                {formatCurrency(Math.abs(remaining), { locale: localeString, symbol: currencySymbol })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('family.sharedTransactions')}
              </p>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                {stats?.count || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members Summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3">
          {t('family.membersOverview')}
        </h3>
        <div className="space-y-3">
          {household.members.map(member => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br",
                  getGradient(member.id)
                )}>
                  {getInitials(member.name, member.email)}
                </div>
                <div>
                  <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
                    {member.name || member.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {member.role === 'owner' ? t('family.owner') : t('family.member')}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-semibold text-sm",
                member.monthlySalary ? "text-emerald-500" : "text-[rgb(var(--text-tertiary))]"
              )}>
                {member.monthlySalary 
                  ? formatCurrency(member.monthlySalary, { locale: localeString, symbol: currencySymbol })
                  : '-'
                }
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Transactions */}
      {stats?.recentTransactions?.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3">
            {t('transactions.recentTransactions')}
          </h3>
          <div className="space-y-3">
            {stats.recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {new Date(transaction.date).toLocaleDateString(localeString)}
                  </p>
                </div>
                <p className={cn(
                  "font-semibold text-sm",
                  transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Transactions Tab
function FamilyTransactions({ household, currencySymbol, localeString }) {
  const { t } = useI18n()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions?onlyShared=true')
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[rgb(var(--accent))] border-t-transparent"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<Receipt className="w-10 h-10" />}
          title={t('family.noSharedTransactions')}
          description={t('family.noSharedTransactionsDescription')}
        />
      </Card>
    )
  }

  // Group by date
  const grouped = transactions.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString(localeString)
    if (!acc[date]) acc[date] = []
    acc[date].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] mb-2 px-1">
            {date}
          </p>
          <Card className="divide-y divide-[rgb(var(--border-primary))]">
            {txns.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
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
                  </div>
                </div>
                <p className={cn(
                  "font-semibold ms-4",
                  transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, { locale: localeString, symbol: currencySymbol })}
                </p>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

// Members Tab
function FamilyMembers({ household, currencySymbol, localeString, onUpdate }) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      {household.members.map((member) => (
        <MemberCard 
          key={member.id} 
          member={member} 
          currencySymbol={currencySymbol}
          localeString={localeString}
          isCurrentUser={member.isCurrentUser}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}

// Settings Tab
function FamilySettings({ household, onLeave, onCancelInvitation, localeString }) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* Pending Invitations */}
      {household.invitations && household.invitations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3">
            {t('family.pendingInvitations')}
          </h3>
          <div className="space-y-2">
            {household.invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-tertiary))]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {invitation.email || t('family.linkInvitation')}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {invitation.expiresAt && new Date(invitation.expiresAt).toLocaleDateString(localeString)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onCancelInvitation(invitation.id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="p-4">
        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3">
          {t('settings.dangerZone')}
        </h3>
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('family.leaveHousehold')}</span>
        </button>
      </Card>
    </div>
  )
}

// Member Card Component
function MemberCard({ member, currencySymbol, localeString, isCurrentUser, onUpdate }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [salary, setSalary] = useState(member.monthlySalary || '')
  const [salaryDay, setSalaryDay] = useState(member.salaryDay || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/households/members/salary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlySalary: salary, salaryDay }),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast.success(t('family.salarySaved'))
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      toast.error(t('family.salarySaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br",
            getGradient(member.id)
          )}>
            {getInitials(member.name, member.email)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                {member.name || member.email}
              </p>
              {isCurrentUser && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                  {t('family.you')}
                </span>
              )}
            </div>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {member.role === 'owner' ? t('family.owner') : t('family.member')}
            </p>
          </div>

          <div className="text-right">
            {member.monthlySalary ? (
              <>
                <p className="font-semibold text-emerald-500">
                  {formatCurrency(member.monthlySalary, { locale: localeString, symbol: currencySymbol })}
                </p>
                {member.salaryDay && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('family.paidOnDay', { day: member.salaryDay })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                {t('family.noSalarySet')}
              </p>
            )}
          </div>
        </div>

        {isCurrentUser && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full mt-3 py-2.5 text-sm font-medium text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 rounded-xl hover:bg-[rgb(var(--accent))]/20 transition-colors"
          >
            {member.monthlySalary ? t('common.edit') : t('family.addSalary')}
          </button>
        )}
      </div>

      {isCurrentUser && isEditing && (
        <div className="px-4 pb-4 pt-3 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('family.monthlySalary')}
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('family.salaryDay')}
              </label>
              <select
                value={salaryDay}
                onChange={(e) => setSalaryDay(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              >
                <option value="">{t('family.selectDay')}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 h-11 rounded-xl border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

// Helper functions
function getInitials(name, email) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return '?'
}

function getGradient(id) {
  const gradients = [
    'from-blue-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-violet-500',
    'from-cyan-500 to-blue-500',
  ]
  return gradients[id.charCodeAt(0) % gradients.length]
}
