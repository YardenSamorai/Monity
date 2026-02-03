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
  ChevronRight,
  Wallet,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  LogOut,
  Clock,
  Banknote
} from 'lucide-react'

export function FamilyClient() {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview') // overview, members, income, settings
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
      // Just copy the link
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

  // Main family view
  return (
    <div className="pb-6">
      {/* Header Card with Total Income */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-b-3xl mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-100 text-sm">{household.name}</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(household.totalHouseholdIncome || 0, { locale: localeString, symbol: currencySymbol })}
            </p>
            <p className="text-emerald-100 text-sm mt-1">
              {t('family.totalMonthlyIncome')}
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <Users className="w-5 h-5 mb-1 text-emerald-200" />
            <p className="text-xl font-semibold">{household.members.length}</p>
            <p className="text-xs text-emerald-200">{t('family.members')}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <Banknote className="w-5 h-5 mb-1 text-emerald-200" />
            <p className="text-xl font-semibold">{household.members.filter(m => m.monthlySalary).length}</p>
            <p className="text-xs text-emerald-200">{t('family.withSalary')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Members Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('family.membersOverview')}
            </h2>
          </div>
          
          <div className="space-y-2">
            {household.members.map((member) => (
              <MemberCard 
                key={member.id} 
                member={member} 
                currencySymbol={currencySymbol}
                localeString={localeString}
                isCurrentUser={member.isCurrentUser}
                onUpdate={fetchHousehold}
              />
            ))}
          </div>
        </section>

        {/* Pending Invitations */}
        {household.invitations && household.invitations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-3">
              {t('family.pendingInvitations')}
            </h2>
            <div className="space-y-2">
              {household.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
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
                        {t('family.pending')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="pt-4">
          <button
            onClick={handleLeaveHousehold}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('family.leaveHousehold')}</span>
          </button>
        </section>
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

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    if (email) return email[0].toUpperCase()
    return '?'
  }

  const getGradient = (id) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-rose-500',
      'from-pink-500 to-violet-500',
      'from-cyan-500 to-blue-500',
    ]
    return gradients[id.charCodeAt(0) % gradients.length]
  }

  return (
    <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br",
            getGradient(member.id)
          )}>
            {getInitials(member.name, member.email)}
          </div>
          
          {/* Info */}
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

          {/* Salary Display */}
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

        {/* Edit Button for Current User */}
        {isCurrentUser && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full mt-3 py-2 text-sm font-medium text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 rounded-lg hover:bg-[rgb(var(--accent))]/20 transition-colors"
          >
            {member.monthlySalary ? t('common.edit') : t('family.addSalary')}
          </button>
        )}
      </div>

      {/* Edit Form */}
      {isCurrentUser && isEditing && (
        <div className="px-4 pb-4 pt-2 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('family.monthlySalary')}
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('family.salaryDay')}
              </label>
              <select
                value={salaryDay}
                onChange={(e) => setSalaryDay(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]"
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
              className="flex-1 h-10 rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
