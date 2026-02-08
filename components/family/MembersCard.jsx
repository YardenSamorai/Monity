'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, cn } from '@/lib/utils'
import { useDataRefresh, EVENTS } from '@/lib/realtime-context'
import { 
  Shield, 
  User, 
  Eye, 
  Crown,
  ChevronDown,
  ChevronUp,
  Trash2,
  DollarSign,
  Users,
  TrendingDown,
  Calendar,
  Receipt,
} from 'lucide-react'

const ROLE_CONFIG = {
  owner: {
    label: 'family.roleOwner',
    icon: Crown,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    iconColor: 'text-amber-600',
  },
  admin: {
    label: 'family.roleAdmin',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    iconColor: 'text-blue-600',
  },
  member: {
    label: 'family.roleMember',
    icon: User,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconColor: 'text-slate-600',
  },
  viewer: {
    label: 'family.roleViewer',
    icon: Eye,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    iconColor: 'text-slate-500',
  },
}

export function MembersCard({ household, onUpdate }) {
  const { t, currencySymbol, localeString } = useI18n()
  const { toast } = useToast()
  const [expandedMember, setExpandedMember] = useState(null)
  const [memberStats, setMemberStats] = useState({})
  const [loadingStats, setLoadingStats] = useState(true)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const currentUserMember = household?.members?.find(m => m.isCurrentUser)
  const isOwnerOrAdmin = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role)
  const isOwner = currentUserMember?.role === 'owner'

  const fetchStats = useCallback(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    fetch(`/api/transactions?onlyShared=true&startDate=${start.toISOString()}&endDate=${end.toISOString()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const transactions = data.transactions || []
        const stats = {}
        
        transactions.forEach(tx => {
          if (!stats[tx.userId]) {
            stats[tx.userId] = { spent: 0, income: 0, count: 0 }
          }
          if (tx.type === 'expense') {
            stats[tx.userId].spent += Number(tx.amount)
          } else if (tx.type === 'income') {
            stats[tx.userId].income += Number(tx.amount)
          }
          stats[tx.userId].count += 1
        })
        
        setMemberStats(stats)
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Real-time updates
  useDataRefresh({
    key: 'members-card-stats',
    fetchFn: fetchStats,
    events: [
      EVENTS.TRANSACTION_CREATED,
      EVENTS.TRANSACTION_UPDATED,
      EVENTS.TRANSACTION_DELETED,
      EVENTS.FAMILY_TRANSACTION,
      EVENTS.DASHBOARD_UPDATE,
    ],
  })

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    if (email) return email[0].toUpperCase()
    return '?'
  }

  const getAvatarColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-cyan-500',
    ]
    return colors[index % colors.length]
  }

  const totalSpent = Object.values(memberStats).reduce((sum, s) => sum + s.spent, 0)

  return (
    <>
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--border-primary))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('family.members')}
            </h3>
          </div>
          <span className="text-sm text-[rgb(var(--text-tertiary))]">
            {household.members.length} {t('family.membersLabel')}
          </span>
        </div>
      </div>

      {/* Members List */}
      <div className="divide-y divide-[rgb(var(--border-primary))]">
        {household.members.map((member, index) => {
          const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member
          const RoleIcon = role.icon
          const isExpanded = expandedMember === member.id
          const stats = memberStats[member.userId] || { spent: 0, income: 0, count: 0 }
          const spentPercentage = totalSpent > 0 ? Math.round((stats.spent / totalSpent) * 100) : 0
          const isCurrentUser = member.isCurrentUser

          return (
            <div key={member.id}>
              {/* Main Row */}
              <button
                className="w-full p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors text-start"
                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0",
                    getAvatarColor(index)
                  )}>
                    {getInitials(member.name, member.email)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                        {member.name || member.email?.split('@')[0]}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                          {t('family.you')}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full mt-1",
                      role.color
                    )}>
                      <RoleIcon className="w-3 h-3" />
                      {t(role.label)}
                    </span>
                  </div>

                  {/* Stats summary */}
                  <div className="text-end flex-shrink-0">
                    {stats.count > 0 ? (
                      <>
                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums" dir="ltr">
                          -{formatCurrency(stats.spent, { locale: localeString, symbol: currencySymbol })}
                        </p>
                        <p className="text-[11px] text-[rgb(var(--text-tertiary))]">
                          {stats.count} {t('family.transactionsLabel')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {t('family.noActivity')}
                      </p>
                    )}
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-center">
                      <TrendingDown className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('family.spent')}</p>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums" dir="ltr">
                        {formatCurrency(stats.spent, { locale: localeString, symbol: currencySymbol })}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-center">
                      <Receipt className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('family.transactionsThisMonth')}</p>
                      <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                        {stats.count}
                      </p>
                    </div>
                    {member.monthlySalary ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-center">
                        <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('family.monthlySalary')}</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" dir="ltr">
                          {formatCurrency(member.monthlySalary, { locale: localeString, symbol: currencySymbol })}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                        <DollarSign className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('family.monthlySalary')}</p>
                        <p className="text-sm text-[rgb(var(--text-tertiary))]">—</p>
                      </div>
                    )}
                  </div>

                  {/* Spending bar */}
                  {totalSpent > 0 && stats.spent > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))] mb-1">
                        <span>{t('family.shareOfExpenses')}</span>
                        <span className="font-medium">{spentPercentage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgb(var(--bg-tertiary))] overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", getAvatarColor(index))}
                          style={{ width: `${spentPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Joined Date */}
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                    <Calendar className="w-3 h-3" />
                    {t('family.joinedOn')} {new Date(member.joinedAt).toLocaleDateString(localeString)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Salary editor for current user */}
                    {isCurrentUser && (
                      <MemberSalaryEditor 
                        member={member} 
                        onUpdate={onUpdate}
                        currencySymbol={currencySymbol}
                        localeString={localeString}
                      />
                    )}

                    {/* Role management for owners/admins */}
                    {isOwnerOrAdmin && !isCurrentUser && (
                      <>
                        {(isOwner || (currentUserMember.role === 'admin' && member.role !== 'owner')) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRoleTarget(member)
                              setRoleModalOpen(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {t('family.changeRole')}
                          </button>
                        )}
                        {(isOwner || (currentUserMember.role === 'admin' && !['owner', 'admin'].includes(member.role))) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRemoveTarget(member)
                              setRemoveDialogOpen(true)
                            }}
                            className="flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('family.removeMember')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>

    {/* Change Role Modal */}
    <RoleChangeModal
      isOpen={roleModalOpen}
      onClose={() => {
        setRoleModalOpen(false)
        setRoleTarget(null)
      }}
      member={roleTarget}
      isCurrentUserOwner={isOwner}
      onSave={async (memberId, newRole) => {
        try {
          const res = await fetch('/api/households/members/role', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, role: newRole }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to update role')
          }
          toast.success(t('family.roleUpdated'))
          setRoleModalOpen(false)
          setRoleTarget(null)
          onUpdate()
        } catch (error) {
          toast.error(t('family.roleUpdateFailed'), error.message)
        }
      }}
    />

    {/* Remove Member Dialog */}
    {removeTarget && (
      <ConfirmDialog
        isOpen={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false)
          setRemoveTarget(null)
        }}
        title={t('family.removeMember')}
        message={t('family.removeMemberConfirm', { name: removeTarget?.name || removeTarget?.email?.split('@')[0] || '' })}
        confirmLabel={t('family.removeMember')}
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          try {
            const res = await fetch('/api/households/members/remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memberId: removeTarget.id }),
            })
            if (!res.ok) {
              const data = await res.json()
              throw new Error(data.error || 'Failed to remove member')
            }
            toast.success(t('family.memberRemoved'))
            setRemoveDialogOpen(false)
            setRemoveTarget(null)
            onUpdate()
          } catch (error) {
            toast.error(t('family.memberRemoveFailed'), error.message)
          }
        }}
        variant="danger"
      />
    )}
    </>
  )
}

// Role Change Modal
function RoleChangeModal({ isOpen, onClose, member, isCurrentUserOwner, onSave }) {
  const { t } = useI18n()
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (member) setSelectedRole(member.role)
  }, [member])

  if (!member) return null

  const availableRoles = isCurrentUserOwner 
    ? ['owner', 'admin', 'member', 'viewer']
    : ['admin', 'member', 'viewer']

  const roleDescriptions = {
    owner: { icon: Crown, label: t('family.roleOwner'), desc: t('family.roleOwnerDesc') },
    admin: { icon: Shield, label: t('family.roleAdmin'), desc: t('family.roleAdminDesc') },
    member: { icon: User, label: t('family.roleMember'), desc: t('family.roleMemberDesc') },
    viewer: { icon: Eye, label: t('family.roleViewer'), desc: t('family.roleViewerDesc') },
  }

  const handleSave = async () => {
    if (selectedRole === member.role) { onClose(); return }
    setSaving(true)
    try { await onSave(member.id, selectedRole) } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('family.changeRoleFor', { name: member.name || member.email?.split('@')[0] || '' })} size="md">
      <div className="space-y-2">
        {availableRoles.map(roleId => {
          const roleInfo = roleDescriptions[roleId]
          const Icon = roleInfo.icon
          const isSelected = selectedRole === roleId
          const isCurrent = member.role === roleId

          return (
            <button
              key={roleId}
              onClick={() => setSelectedRole(roleId)}
              className={cn(
                "w-full p-3 rounded-xl border-2 text-start transition-all flex items-start gap-3",
                isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", isSelected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-[rgb(var(--bg-tertiary))]")}>
                <Icon className={cn("w-4 h-4", isSelected ? "text-blue-600 dark:text-blue-400" : "text-[rgb(var(--text-tertiary))]")} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", isSelected ? "text-blue-600 dark:text-blue-400" : "text-[rgb(var(--text-primary))]")}>
                    {roleInfo.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {t('family.currentRole')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{roleInfo.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex gap-3 mt-5">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving || selectedRole === member.role}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}

// Salary Editor Sub-component
function MemberSalaryEditor({ member, onUpdate, currencySymbol, localeString }) {
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
        body: JSON.stringify({ 
          monthlySalary: salary ? parseFloat(salary) : null, 
          salaryDay: salaryDay ? parseInt(salaryDay) : null 
        }),
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

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
      >
        <DollarSign className="w-3.5 h-3.5" />
        {member.monthlySalary ? t('family.editSalary') : t('family.addSalary')}
      </button>
    )
  }

  return (
    <div className="w-full p-3 rounded-xl bg-[rgb(var(--bg-tertiary))] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('family.monthlySalary')}
          </label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="0"
            className="w-full h-9 px-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('family.salaryDay')}
          </label>
          <select
            value={salaryDay}
            onChange={(e) => setSalaryDay(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] text-sm"
          >
            <option value="">{t('family.selectDay')}</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsEditing(false)} className="flex-1 h-8 rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] text-xs font-medium hover:bg-[rgb(var(--bg-secondary))] transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={handleSave} disabled={saving} className="flex-1 h-8 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}
